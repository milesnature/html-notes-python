# HTML Notes

HTML Notes is a lightweight design system written in HTML, CSS, Javascript, with a splash of Python. The primary goal of this system is to neatly organize an entire collection of HTML files (notes) into a single web page. It's designed to be clean, concise, and efficient.

It favors simple HTML files, self-custody, client-side encryption, and freedom from proprietary programs and formats.

If you're a meticulous note taker, expending the time and effort to format and "style" your plain text notes — *you may as well be using HTML and CSS to do it!*
It's more powerful and accessible than Markdown with nearly the same amount of effort.

## Example
https://python.html-notes.app/
* Encryption disabled for ease of use.
* Saving notes disabled for security.


### Pros
* Private. Client-side encryption (AES) means you can host your files remotely with confidence.
* External hosting. Perfect for anyone that uses multiple browsers and or multiple devices.
* Portable. Increase privacy and security by hosting it locally, or by hard coding everything into one single html file.
* Prevent duplicates. A single source helps prevent the spread/duplication of files across devices, applications, and directories.
* Self-custody. No ads, no tracking, no third parties.
* No database.
* Super lightweight. Lightening fast load times. No compiling or builds. Minimal Python script (to edit/write files). It is easily swapped out with another back-end, like Python or Node.
* Search is instantaneous because all the data is on a single page.
* Edit notes directly in the browser or in your favorite text editor.
* Designed for mobile and desktop.
* Keyboard accessible with tabbed navigation.


### Cons
* Basic knowledge of HTML, CSS, and JSON is required.
* A fair amount of traditional front-end web development knowledge is required to set up. Afterwards, the maintenance is trivial and updating notes can be done from the browser.
* Adding new sections and files is still a manual process.
* You must completely trust anyone with access to this site! It would be a _security nightmare_ otherwise.
* Using a code editor is the most powerful experience.
* Once files are encrypted, the only reasonable way to edit them is through the browser.
* Tailored to the organized, meticulous note taker.


## Basic Anatomy

This implementation requires the [Flask](https://flask.palletsprojects.com/en/2.2.x/) web application framework.

Each individual note (category) uses the following HTML structure.

    <details id="aNote" class="notes__details">
      <summary><strong>A Note</strong>
        <button title="Edit A Note" type="button"><span>Edit</span></button>
      </summary>
      <div class="notes__sections">
        <section class="bkm__section">
          <ul>
            <li><a href="https://link.com" noreferrer="">Bookmark</a></li>
          </ul>
        </section>
        <section class="note__section">
          <h3>Generic note section</h3>
          <ul>
              <li>Item 1</li>
              <li>Item 2</li>
              <li>Item 3</li>
          </ul>
        </section>
      </div>
    </details>

There are 3 types of sections (indicated by class): Bookmarks, Notes, and Checklists.

    .bkm__section
    .note__section
    .cl__section

A single note/file can contain multiple sections. The first section is a list of bookmarks (recommended), followed by any number of additional sections.

The following classes will increase the default width of a section to span 2, 3, or 4 columns.

    .note--double-wide
    .note--triple-wide
    .note--quadruple-wide

Highlighted code blocks will copy to clipboard on click or enter.

    <button class="code">Java</button>

### Config File
    const useEncryption = true;
    const isDemo = false;
    const notesDirectory = "notes/";

A `getDir()` call returns all the html and txt files from the `/notes` directory in alphabetical order. A `notes` array object is generated and used to download and construct all the notes. The order (of this array) determines the order on the page. 

The id of each category or note (derived from the directory or file name) will be used for the name of each respective note category. Hence, the capitalization. The same is true for the directories. **No duplicate names are permitted because duplicate ids are invalid html. Enforcing case sensitivity for directories and files could have adverse affects.**

Once the index file has loaded, the site will check for a locally stored passphrase. If one is not found, a prompt will persist until one is entered. Javascript will decrypt any encrypted sections and the site will be ready.

A passcode cannot be changed after it is used. However, you could copy and paste the unencrypted code back into your files and start over. Using more than one passcode to encrypt data will break the site. Any decryption failures will interrupt the process and launch the passphrase modal again.

**Encryption is using CryptoJS and temporarily storing the passphrase in the browser session storage. This is vulnerable to XSS attacks but is fairly secure otherwise. The main reason for the encryption is to prevent the web-host from snooping. True secrecy would require more.**

Unencrypted notes will have a pink background when useEncryption is enabled. Edit the note from the browser and save to encrypt it. The passphrase in session storage is used to encrypt.

Refer to the browser console for detailed error messages.

Some things, like the local storage of notes, are ongoing experiments. 



## What inspired this specific implementation?

#### Simplicity is divine.

HTML is ubiquitous, flexible, and simple to maintain.

I am toying with the notion of an SFA (Single File Application). A lightweight, highly performant, single purpose variant of the SPA. No frameworks, no dependencies, no bloat. "What about all of these files?", you may ask. They are split out to make life easier (see Basic Anatomy). However, this page could easily be converted into a single, static html file including all the content, CSS, and Javascript (inline).

The latest CSS and JS was leveraged whenever possible because my personal requirements do not include comprehensive backwards compatibility and (to be honest) it's more fun that way.

I am re-evaluating popular UX conventions:

* Does everything clickable need a pointer cursor? I had always felt it did. However, after reading some arguments against it, I'm not so sure. Less is more. The closer to default functionality the better.
* How effective/helpful are hover effects? Should they be dramatic or subtle? I suspect they are marginally helpful and should be very subtle or left out.
* Are modals good UX? I've spent years implementing them for companies that believed they were. They are bad for accessibility, visually disruptive, troublesome to implement (style), and awkward in mobile. My new strategy is to avoid them whenever possible.




## The Future
I wrote this tool for myself which means future development will be limited to my whimsical desires and needs. This could change with increased interest.
* Make this easier to use for non-technical folks.
  * Enable updates to config from browser.
  * Enable users to create, delete, and rename the notes in their repository from the browser.
  * Export tool
  * Decryption tool
  * File upload
* Add encryption for images. Probably base-64. Otherwise, linking to external (encrypted) storage is a good solution.
* Explore the PWA options that enable edits to files on local directories...
* Scrape the notes directory to dynamically generate `notes` object.
* Notifications for success and failure?
* View passphrase
* Throttle number of passphrase attempts.
* Use timestamps to help manage overwriting new files and general sync issues.
* Tally calculator
* Create a non-javascript version?
* Maybe just keep this as simple as possible. :)