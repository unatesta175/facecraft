#!/usr/bin/env python3
"""
Transform raw FaceCraft admin API JSON into normalized files for Prisma import.

Usage (from repo root):
  python tools/migration/transform_all.py
"""

from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
RAW = ROOT / "raw"
NORMALIZED = ROOT / "normalized"

PRODUCT_TYPE_MAP = {
    "others": "OTHERS",
    "magnet": "MAGNET",
    "email": "EMAIL",
    "certificate_left_1": "CERTIFICATE_LEFT_1",
    "certificate_left_2": "CERTIFICATE_LEFT_2",
    "certificate_right_1": "CERTIFICATE_RIGHT_1",
}

USER_TYPE_MAP = {
    "admin": "ADMIN",
    "manager": "MANAGER",
    "supervisor": "SUPERVISOR",
    "account_manager": "ACCOUNT_MANAGER",
    "staff": "STAFF",
    "photographer": "STAFF",
}


def load_json(name: str) -> list:
    path = RAW / name
    if not path.exists():
        return []
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    return data if isinstance(data, list) else []


def save_json(name: str, data) -> None:
    NORMALIZED.mkdir(parents=True, exist_ok=True)
    with (NORMALIZED / name).open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def is_deleted(row: dict) -> bool:
    return row.get("deletedAt") is not None


def bool_status(value, active_label="ACTIVE", inactive_label="INACTIVE"):
    return active_label if bool(value) else inactive_label


def with_created_at(row: dict) -> dict:
    if row.get("createdAt"):
        return {"createdAt": row["createdAt"]}
    return {}


def parse_size(size_str: str | None) -> dict | None:
    if not size_str or not str(size_str).strip():
        return None
    match = re.search(r"([\d.]+)\s*x\s*([\d.]+)", str(size_str), re.IGNORECASE)
    if not match:
        return None
    width = float(match.group(1))
    height = float(match.group(2))
    key = f"{width:g}x{height:g}"
    return {"key": key, "width": width, "height": height}


def transform_sizes(products: list[dict]) -> list[dict]:
    seen: dict[str, dict] = {}
    for row in products:
        if is_deleted(row):
            continue
        parsed = parse_size(row.get("size"))
        if parsed and parsed["key"] not in seen:
            seen[parsed["key"]] = parsed
    return list(seen.values())


def transform_sizes_from_master(rows: list[dict]) -> list[dict]:
    out = []
    for row in rows:
        width = float(row["width"])
        height = float(row["height"])
        entry = {
            "key": row.get("key") or f"{width:g}x{height:g}",
            "width": width,
            "height": height,
        }
        if row.get("createdAt"):
            entry["createdAt"] = row["createdAt"]
        aliases = row.get("aliases") or []
        if aliases:
            entry["aliases"] = aliases
        out.append(entry)
    return out


def transform_discounts(rows: list[dict]) -> list[dict]:
    out = []
    for row in rows:
        if is_deleted(row):
            continue
        out.append(
            {
                "code": row.get("code") or row.get("discount_code"),
                "amount": row.get("amount") or 0,
                "description": row.get("description"),
                "createdAt": row.get("createdAt"),
            }
        )
    return out


def transform_products(products: list[dict], report: dict) -> list[dict]:
    out = []
    for row in products:
        if is_deleted(row):
            continue
        product_type = row.get("product_type") or "others"
        mapped_type = PRODUCT_TYPE_MAP.get(str(product_type).lower())
        if not mapped_type:
            report["warnings"].append(
                f"Unknown product_type '{product_type}' for product {row.get('id')} — defaulting to OTHERS"
            )
            mapped_type = "OTHERS"

        parsed = parse_size(row.get("size"))
        if row.get("size") and not parsed:
            report["warnings"].append(
                f"Could not parse size '{row.get('size')}' for product {row.get('product_name')}"
            )

        description = row.get("description")
        cert = row.get("certificate_name")
        if cert:
            extra = f"Certificate: {cert}"
            description = f"{description}\n{extra}" if description else extra

        out.append(
            {
                "legacyId": row["id"],
                "name": row.get("product_name") or "Unnamed product",
                "price": row.get("price") or 0,
                "description": description,
                "productType": mapped_type,
                "photoLimit": row.get("photo_limit") or 0,
                "sizeKey": parsed["key"] if parsed else None,
                "imageUrl": row.get("img_url"),
                "status": bool_status(row.get("status")),
                **with_created_at(row),
            }
        )
    return out


def transform_combos(combos: list[dict]) -> list[dict]:
    out = []
    for row in combos:
        if is_deleted(row):
            continue
        out.append(
            {
                "legacyId": row["id"],
                "name": row.get("combo_name") or "Unnamed combo",
                "price": row.get("price") or 0,
                "description": row.get("description"),
                "thumbnailUrl": row.get("img_url"),
                "status": bool_status(row.get("status"), "ACTIVE", "INACTIVE"),
                **with_created_at(row),
            }
        )
    return out


def transform_frames(frames: list[dict]) -> list[dict]:
    out = []
    for row in frames:
        if is_deleted(row):
            continue
        out.append(
            {
                "legacyId": row["id"],
                "name": (row.get("frame_name") or "Unnamed frame").strip(),
                "imageUrl": row.get("img_url"),
                "status": bool_status(row.get("status")),
                **with_created_at(row),
            }
        )
    return out


def transform_object_master_row(row: dict) -> dict:
    return {
        "legacyId": row["id"],
        "title": row.get("title") or "Untitled",
        "description": row.get("description"),
        "imageUrl": row.get("img_url"),
        "status": bool_status(row.get("status"), "ACTIVE", "INACTIVE"),
        **with_created_at(row),
    }


def transform_object_masters(rows: list[dict], ultra_rows: list[dict] | None = None) -> list[dict]:
    """Merge standalone object masters with nested ones from ultra_object_masters."""
    by_id: dict[str, dict] = {}

    for row in rows:
        if is_deleted(row):
            continue
        by_id[row["id"]] = transform_object_master_row(row)

    for ultra in ultra_rows or []:
        if is_deleted(ultra):
            continue
        for obj in ultra.get("objectMasters") or []:
            if is_deleted(obj):
                continue
            by_id[obj["id"]] = transform_object_master_row(obj)

    return list(by_id.values())


def transform_ultra_objects(rows: list[dict]) -> tuple[list[dict], list[dict]]:
    ultra_out = []
    items_out = []
    for row in rows:
        if is_deleted(row):
            continue
        ultra_out.append(
            {
                "legacyId": row["id"],
                "title": row.get("title") or "Untitled",
                "description": row.get("description"),
                "imageUrl": row.get("img_url"),
                "status": bool_status(row.get("status"), "ACTIVE", "INACTIVE"),
                **with_created_at(row),
            }
        )
        for obj in row.get("objectMasters") or []:
            if is_deleted(obj):
                continue
            items_out.append(
                {
                    "ultraObjectLegacyId": row["id"],
                    "objectMasterLegacyId": obj["id"],
                }
            )
    return ultra_out, items_out


def make_unique_email(email: str | None, username: str, legacy_id: str, used: set[str]) -> str:
    if email and "@" in str(email):
        local = str(email).split("@")[0].strip().lower()
        local = re.sub(r"[^a-z0-9._-]", "", local)
    else:
        local = re.sub(r"[^a-z0-9._-]", "", username.lower())
    if not local:
        local = legacy_id[:8].lower()

    candidate = f"{local}@gmail.com"
    n = 2
    while candidate in used:
        candidate = f"{local}{n}@gmail.com"
        n += 1
    used.add(candidate)
    return candidate


def make_staff_code(role_id: str | None, username: str, legacy_id: str, used: set[str]) -> str:
    candidate = (role_id or "").strip()
    if not candidate or not re.match(r"^Fc\d+$", candidate, re.IGNORECASE):
        candidate = f"LEG-{legacy_id[:8].upper()}"
    if candidate in used:
        candidate = f"LEG-{legacy_id[:8].upper()}"
    n = 2
    base = candidate
    while candidate in used:
        candidate = f"{base}-{n}"
        n += 1
    used.add(candidate)
    return candidate


def transform_user_row(row: dict, used_emails: set[str], used_staff_codes: set[str], used_usernames: set[str]) -> dict | None:
    if is_deleted(row):
        return None

    username = (row.get("user_name") or row.get("name") or row["id"][:8]).strip()
    if not username:
        username = row["id"][:8]

    username_key = username.lower()
    if username_key in used_usernames:
        username = f"{username}_{row['id'][:6]}"
    used_usernames.add(username.lower())

    user_type = str(row.get("user_type") or "staff").lower()
    role = USER_TYPE_MAP.get(user_type, "STAFF")

    email = make_unique_email(row.get("email_id"), username, row["id"], used_emails)
    staff_code = make_staff_code(row.get("role_id"), username, row["id"], used_staff_codes)

    status = "ACTIVE" if row.get("status") else "INACTIVE"
    if row.get("del_acc") is True:
        status = "INACTIVE"
    elif role in {"ADMIN", "MANAGER", "SUPERVISOR", "ACCOUNT_MANAGER"}:
        # Portal roles must be able to log in after reseed even if legacy status was false.
        status = "ACTIVE"

    return {
        "legacyId": row["id"],
        "staffCode": staff_code,
        "name": row.get("name") or username,
        "username": username,
        "email": email,
        "phone": row.get("ph_number"),
        "locationArea": row.get("location"),
        "role": role,
        "deletePermission": bool(row.get("del_acc")),
        "profileImageUrl": row.get("img") or None,
        "status": status,
        "plainPassword": "password123",
        **with_created_at(row),
    }


def transform_users(roles: list[dict], photographers: list[dict], report: dict) -> list[dict]:
    used_emails: set[str] = set()
    used_staff_codes: set[str] = set()
    used_usernames: set[str] = set()
    seen_legacy_ids: set[str] = set()
    out = []

    for source_name, rows in [("roles.json", roles), ("photographers.json", photographers)]:
        for row in rows:
            legacy_id = row.get("id")
            if legacy_id in seen_legacy_ids:
                report["skipped"].append(f"{source_name}: duplicate legacy id {legacy_id}")
                continue
            seen_legacy_ids.add(legacy_id)

            user = transform_user_row(row, used_emails, used_staff_codes, used_usernames)
            if user:
                user["isPhotographer"] = source_name == "photographers.json"
                out.append(user)
            else:
                report["skipped"].append(f"{source_name}: skipped deleted user {legacy_id}")

    return out


def transform_kiosks(rows: list[dict]) -> list[dict]:
    out = []
    used_usernames: set[str] = set()
    for row in rows:
        if is_deleted(row):
            continue
        username = (row.get("user_name") or row.get("name") or row["id"][:8]).strip()
        if username.lower() in used_usernames:
            username = f"{username}_{row['id'][:6]}"
        used_usernames.add(username.lower())

        out.append(
            {
                "legacyId": row["id"],
                "name": row.get("name") or username,
                "username": username,
                "description": row.get("description"),
                "profileImageUrl": row.get("img") or None,
                "status": "ACTIVE" if row.get("status") else "INACTIVE",
                "plainPassword": "password123",
                **with_created_at(row),
            }
        )
    return out


def main() -> int:
    report = {"warnings": [], "skipped": [], "counts": {}}

    products_raw = load_json("products.json")
    sizes_raw = load_json("sizes.json")
    discounts_raw = load_json("discounts.json")
    combos_raw = load_json("combos.json")
    frames_raw = load_json("frames.json")
    object_masters_raw = load_json("object_masters.json")
    ultra_raw = load_json("ultra_object_masters.json")
    roles_raw = load_json("roles.json")
    photographers_raw = load_json("photographers.json")
    kiosks_raw = load_json("kiosks.json")

    sizes = transform_sizes_from_master(sizes_raw) if sizes_raw else transform_sizes(products_raw)
    products = transform_products(products_raw, report)
    combos = transform_combos(combos_raw)
    frames = transform_frames(frames_raw)
    object_masters = transform_object_masters(object_masters_raw, ultra_raw)
    ultra_objects, ultra_items = transform_ultra_objects(ultra_raw)
    users = transform_users(roles_raw, photographers_raw, report)
    kiosks = transform_kiosks(kiosks_raw)

    discounts = transform_discounts(discounts_raw)

    save_json("sizes.json", sizes)
    save_json("discounts.json", discounts)
    save_json("products.json", products)
    save_json("combo_products.json", combos)
    save_json("frames.json", frames)
    save_json("object_masters.json", object_masters)
    save_json("ultra_objects.json", ultra_objects)
    save_json("ultra_object_items.json", ultra_items)
    save_json("users.json", users)
    save_json("kiosks.json", kiosks)

    report["counts"] = {
        "sizes": len(sizes),
        "discounts": len(discounts),
        "products": len(products),
        "combo_products": len(combos),
        "frames": len(frames),
        "object_masters": len(object_masters),
        "ultra_objects": len(ultra_objects),
        "ultra_object_items": len(ultra_items),
        "users": len(users),
        "kiosks": len(kiosks),
    }
    save_json("validation_report.json", report)

    print("Migration transform complete.")
    for key, value in report["counts"].items():
        print(f"  {key}: {value}")
    if report["warnings"]:
        print(f"  warnings: {len(report['warnings'])}")
    print(f"Output: {NORMALIZED}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
