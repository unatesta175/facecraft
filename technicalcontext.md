AWS FULL NATIVE ENVIRONMENT SOLUTIONS

Name of the App : FaceCraft

Technical Requirements : 
Tech Stack : 
Frontend :  NextJs App
Backend : Node.js API (Express JS) Prisma for seeding the data and other things too , ensure the database has all of the data
Database :  MySQL
CICD Pipeline : Gitlab 
Proxy Server : Elastic Load Balancer


Concern :  
Expected users :
5.6 customers per jam 
anggaran 1 customer setiap 11 minutes
Make sure to reduce photo editing delay from ~5 minutes to 1–2 seconds when users select up to 20 photos and apply frames, rotation, or resizing.

API & IOT Integration : 
AWS Machine Learning Face Recognition API 
AWS S3 (Storage)
Printer App (HotFolderDNP) 
GHL Card Payment Processing Device (Payment by Card) Refer Official Documentation
Kiosk Device Webcam ( IMIN CRANE 1-Multipurpose IDS)
Hosting Service :  AWS EC2 (Nextjs frontend  + Node.js API backend server + 
MySQL database)
Platform of the application : 
Testing : Web-Based 
Production : Web-Based and running on browser of IMIN Crane 1 Kiosk Which have 3 - 4 kiosk nodes set on a remote place 21inch wide
Platform of Web :  iMin Crane 1 Kiosk
Payment Method : Card / Cash / QR


Design Requirements : 
Design : 
Light Theme , ShadCN UI , Professional , Gradient , Colour Pallete : Chocolate , Yellow , use centralized color changer for this app , which means for now we just use black and white design , but later when we change the theme colour all the page will reflect the changes on its colour

Functional Requirements : 
Important Business Rule  : 
Customer can only access this app on the remote site , not elsewhere , while on the flipside , Photographer and admin can access this app anywhere
Customer does not need to login , register 
Admin , Photographer => RBAC permission , has different sets of actions that they can perform , they need to login and register
Every Order is associated with a particular photographer
Every image is associated with particular photographer
Image in the cloud stays for 7 days only and it will remove after 7 days

SYSTEM TECHNICAL PROCESSES

PHOTOGRAPHER
Photographer needs to take pictures and upload all the images inside the app to the image Cloud

CUSTOMER

UI design Use a loading spinner of the logo of the FaceCraft Studio

1# Home Page 
Its has a:
Hero Section 
Text : 
1. Welcome to Face Craft Studio 
2. purchase your memories by clicking a selfie 
3. please take a selfie to begin
Button : Take a Selfie



 After user clicks the take a selfie button , it will display : 
2#  A modal display which In the first page it will have a webcam open and then there is 2 button (Capture or manual search and can retry )

If user clicks manual search , it will show a page of : 
3# Select your photos page : 
 There us functions for filter for date , time , and then it will display images in 2 columns and can infinitely scroll to bottom , and then at the same time user can switch from frames to frames which the frame choice is displayed on top of the page which can be scrolled horizontally to switch to other frame , when user selects a frame , all of the displayed image will reflect the frame on the image , from all the image shown , user can select the images and then if user can click next to go the next page


If user clicks next
4# Modal display to view all of the chosen images selected with the frames before proceeding
In this modal user can click [<] or [>] button to switch to images that have been chosen , There are also a text that says Kindly view each photo before proceeding. You can adjust the photo size with frames and then click Apply button or close button . During this user can zoom out and zoom in the image . There are also button to rotate the image


There it will display another page which is : 
5# A Shop Page , where it will have 2 column sections , this page will display the total price the quantity that they can increase or lower , 

First Column will display an vertical scrollable list of Package cards where in each cards there will have the package images , package name , and for each package name it can have multiple products , with prod name , total photos it require , and add button for each , and then at bottom of the card , there is Price , total quantities and add to cart button  and also view description of the package icon

So in order for user to checkout , user need to choose at least one package then for example if the package contains 3 products where product A (needs 2 photos) , ,product B (needs 2 photos) , product C (needs 1 photos) . so the package needs 5 total photos , so only if user has click add button for each product for the package then only then user can add to cart for the package , user can only checkout for 1 package at a time , when user selects one quantity of an image( instead of 2) if for example he clicks add on product A that needs 2 photos , a modal will display preview of the photo suited into the frame of the product , then user can click save to display a notification “The xxx.png has been uploaded” . When all products quantity requirement for the package has been fulfilled user can add to package to cart , after that a [Checkout Cart (1)] button will be displayed for user to go to see the cart . User can add another package if they want to (But only if you have added to cart the previous package , or a confirmation prompt will ask Please complete current selection , please complete already selected combo to move to the next. Do you want to clear the pevious selection? Button clear or ok

The products has lots of types : (tell also the different flow user has to go through after clicking add button for the different types of product)
Certificates



2nd Column will display users chosen images vertically , the 2nd section called as Album , For each image it has an AI action button at the top right corner with also a checkbox select button ,

If the user click on the checkbox select field , it will show quantity field for the image where user can choose 

The AI button if pressed , it will display a AI Photo Editor modal display which have display the image to be ai modified ,  and section of gemini AI which shows several buttons that user can click which is Describe Image , Enhance Photo , Remove Background  , Change Background (need to prompt) (A prompt field ,  suggestion buttons of studio , beach , office , nature , city) , Ghibli Style , Pixar 3D , Cartoon , Watercolor , Oil Painting , Detect Objects , Custom Edit with prompt (A prompt field ,  suggestion buttons of add smile , brighten , add text) , then a section of AI Editing and Art Studio which is has 3 button which are AI Background Removal or magic object eraser (A prompt field ,  suggestion buttons of Winking , Disappointment  , Background people ,) and AI Art Studio button (A prompt field ,  suggestion buttons of  chooseGhibli-style , Chibi Cartoon , Pixar , Lego Style ,  Royalheritage , Roblox , Traditional Attire) and then button to apply filter → the after AI filter is applied , there will be a preview slider to compare before and after for the filtered image ,

6# Cart Summary page
In this page, it will display the summary of package chosen , the name , the price , the quantity  and there are also discount field with apply button where user can apply the discount ,total amount and then pay button => then a modal will popup asking for a payment option either scan QR , Card Payment or Cash if user wants to pay for Scan QR or Cash , they need to  enter Staff ID (Kindly enter the staff ID or scan the staff’s QR Code for verification ) then Receipt will printed if payment success , then in the receipt user can scan a qr code that will display to them a page that will display the digital picture to them

Admin 
1# Dashboard page : 
User in dashboard sees new order comes , so then user clicks view order

And then it will show view details page , in this page , it will display orderid , staffid update order status field that the staff can change either pending or completed or cancelled and also a print receipt button 

Then below there is a huge card with which will display the combo ID
Product name , date , time , price , description , image

Then it will display list of package inside the combo package where it can contains multiple images and products images , so then for each package , admin can click the download button or print button (where if the download button is clicked the external app will automatically detect the file and place the file into a folder of a particular size) not handled by system
