# [4.0.0-beta.9] - 2021-02-10

Improvements and fixes to make your everyday experience with Proton Drive better.

## Fixed

- Password protection layout and copy updates
- The Proton security label updated

## Added

- Transfer progress in the transfer manager is now displayed in parentheses
- View file details modal for multiple files selected: number of them, and the total size
- Delete permanently from trash icon is now aligned with the one in ProtonMail
- Improved downloading process by implementing a retry

# [4.0.0-beta.8] - 2021-01-13

With this update we bring you more convenience by remembering which layout you chose to browse your files. Also, numerous bug fixes and improvements.

## Fixed

- Long file name is displayed fully on the download page
- Invisible and breaking characters can no longer be entered into a file name
- Image rendering when in zoomed in mode
- SVG file type detection

## Added

- Layout (Grid or List), and column used for sorting are remembered

# [4.0.0-beta.7] - 2020-12-17

In order to provide full control and comfort for our initial waves of Beta users, we have opted in to set the shared links to never expire by default. However, user can change this option and set number of days for a shared link to expire.

## Added

- By default, shared links will never expire

# [4.0.0-beta.6] - 2020-12-15

More improvements and fixes coming your way before the holiday season kicks in.

## Fixed

- Improved the upload process (block retries)
- You can now pause queued file in Transfer manager
- Changed "No preview available" placeholder image to better convey the situation
- Other minor fixes

## Added

- Black Friday promo replaced with a regular promo text
- og:image and og:description texts added when sharing a link to Proton Drive

# [4.0.0-beta.5] - 2020-12-08 

We have updated share with link feature with easier to grasp labels and more convenient layout to set password.
Further improved uploading experience by chasing down couple of bugs and increasing upload success rating. 
Next, we have made file type recognition better by reading its header bytes.
Read on for the full list of improvements below, and get in touch with us if you have feedback to share please.

## Fixed

- When uploading, naming restrictions updated to avoid errors and name collisions:
  - Only reject files that are names `.`, `..`  or have `/` in their name
  - \ and / symbols not be allowed  
- User can now open image files downloaded via shared link with Firefox mobile browser too
- Upload or download progress rate displayed correctly in the transfer manager header
- File and folder names are selected when rename modal is opened
- Pausing one transfer will not resume another

## Added

- For share with link we have updated: toolbar button and context menu labels, new dialog explanatory text and set password layout 
- Upload URL request retries for more successful operation
- Download URL request retries for more successful operation (for regular downloads, excluding shared links)
- Determine file mime-type from file header bytes, so that we can more reliably determine file mime-type and only use extension as a fallback
- Improved file preview process when previewing a lot of files
- Added tooltips for My files and Trash sections

# [4.0.0-beta.4] - 2020-11-25 

The Proton Drive beta now lets you share files with end-to-end encrypted URL links.
​
In addition, we have been improving the upload experience.

## Fixed

- Upload progress goes above 100% when an upload fails
- Block upload not being retried
- Space at the end shows incorrect error when uploading

## Added

- Share a secure link publicly
- Use a pre-generated password for the secure link, or change it
- Change the default expiration date (90 days) of a secure link

# [4.0.0-beta.3] - 2020-11-11 

We have been working on adding new functionality to ProtonDrive, as well as listening to your feedback to address frictions you've been having.

We resolved large file uploading errors by curing the memory leaks, and before uploading hundreds of files, user will get a warning message. This is to improve the uploading files experience, but it does not stop here, as we will continue iterating and building better product going forward.

Thank you for your feedback and time with us. 

## Fixed

- Memory leaks addressed which caused large uploads to fail
- Updated the encryption label text
- Sorting arrows aligned
- Labels aligned when creating a new folder
- Shift-selecting items on Windows

## Added

- Upload file button in the toolbar
- Warning message when uploading many files
- Retry loop for smoother transfers
- Refresh button to reload the current view in My files and Trash
- Cancel all the transfers when closing Transfer manager

# [4.0.0-beta.2] - 2020-10-14 

## Fixed

- File & Folder details labels vertical alignment
- Toolbar buttons on responsive
- Infinite requests to get trash contents
- Infinite spinner animation after going into folder and back
- Root children are loaded multiple times when loading Drive for the first time
- "Link not found" errors when rapidly cancelling several file uploads
- PDF preview on Firefox
- Minimised Transfer manager does not hide grid item names now
- Improved FAB when Transfer manager opened

## Added

- A new favicon

# [4.0.0-beta.1] - 2020-09-29

Here at Proton we value your support and staying with us over the years. As a token of gratitude, and unveiling our future plans, we give you early access to ProtonDrive Beta. 

With ProtonDrive, you can upload and manage your files, keep your files secure and access them from anywhere.

ProtonDrive has been hand crafted by using end-to-end and zero-access encryption technologies, so no one can read your data. Not even us.
Welcome to ProtonDrive Beta. 

## Added
- See My files in List or Grid view
- Download a file, folder
- Upload a file, folder
- Expand multiple file transfers view, see progress, file name, size

- Preview a file (image, pdf and text types)
- Create a new folder
- Rename a file or folder
- View details of a file or folder

- View storage quota info
- See Trash, delete item, restore item, empty Trash
- Cancel, Pause, Restart or Resume a download or upload
- Move a file or folder: drag & drop, breadcrumbs or dialog

- Sort items by name, size, date modified, type
- Fully smooth Dark mode
- Right click context menu for all the actions to manage items on a desktop browser
- French language support