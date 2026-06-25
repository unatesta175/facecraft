'use client';

import { format, parse } from 'date-fns';
import { Calendar as CalendarIcon, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const triggerClassName =
  'h-12 w-full justify-start rounded-xl border border-[#f0f0f0] bg-[#fafafa] px-3 font-nunito text-left font-normal hover:bg-[#f5f5f5]';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = ['00', '15', '30', '45'];

type KioskDateFilterProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

type KioskTimeFilterProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

export function KioskDateFilter({
  value,
  onChange,
  placeholder = 'Filter by date',
  className,
}: KioskDateFilterProps) {
  const selectedDate = value ? parse(value, 'yyyy-MM-dd', new Date()) : undefined;

  return (
    <div className={cn('relative flex-1', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn(triggerClassName, !value && 'text-[#9a9286]')}>
            <CalendarIcon className="mr-2 h-4 w-4 text-[#9a9286]" />
            {value ? format(selectedDate!, 'MMM d, yyyy') : placeholder}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => onChange(date ? format(date, 'yyyy-MM-dd') : '')}
            initialFocus
          />
        </PopoverContent>
      </Popover>
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#9a9286] hover:bg-[#f0f0f0] hover:text-[#1f1b16]"
          aria-label="Clear date filter"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

export function KioskTimeFilter({
  value,
  onChange,
  placeholder = 'Filter by time',
  className,
}: KioskTimeFilterProps) {
  const [hour = '', minute = ''] = value ? value.split(':') : ['', ''];
  const displayValue = value ? format(parse(value, 'HH:mm', new Date()), 'h:mm a') : placeholder;

  const setTime = (nextHour: string, nextMinute: string) => {
    if (!nextHour || !nextMinute) return;
    onChange(`${nextHour}:${nextMinute}`);
  };

  return (
    <div className={cn('relative flex-1', className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className={cn(triggerClassName, !value && 'text-[#9a9286]')}>
            <Clock className="mr-2 h-4 w-4 text-[#9a9286]" />
            {displayValue}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-4" align="start">
          <div className="flex gap-3">
            <div className="space-y-2">
              <p className="font-nunito text-xs text-[#6b6b6b]">Hour</p>
              <Select value={hour || undefined} onValueChange={(h) => setTime(h, minute || '00')}>
                <SelectTrigger className="w-[100px] rounded-xl">
                  <SelectValue placeholder="HH" />
                </SelectTrigger>
                <SelectContent>
                  {HOURS.map((h) => (
                    <SelectItem key={h} value={h}>
                      {h}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <p className="font-nunito text-xs text-[#6b6b6b]">Minute</p>
              <Select value={minute || undefined} onValueChange={(m) => setTime(hour || '00', m)}>
                <SelectTrigger className="w-[100px] rounded-xl">
                  <SelectValue placeholder="MM" />
                </SelectTrigger>
                <SelectContent>
                  {MINUTES.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#9a9286] hover:bg-[#f0f0f0] hover:text-[#1f1b16]"
          aria-label="Clear time filter"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
