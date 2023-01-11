# HTML Notes

HTML Notes is a lightweight design system written in HTML, CSS, Javascript, with a splash of PHP. The primary goal of this system is to neatly organize an entire collection of HTML files (notes) into a single web page. It's designed to be clean, concise, and efficient.

It favors simple HTML files, self-custody, client-side encryption, and freedom from proprietary programs and formats. Notes taking solutions will come and go but HTML will remain the most ubiquitous, flexible, and simple to maintain.

If you're a meticulous note taker, expending the time and effort to format and "style" your plain text notes — *you may as well be using HTML and CSS to do it!*
It's more powerful and accessible than Markdown with nearly the same amount of effort.

## Example
https://example.html-notes.app/
* Encryption disabled for ease of use.
* Saving notes disabled for security.

### Pros
* Private. Client-side encryption (AES) means you can host your files remotely with confidence.
* External hosting. Perfect for anyone that uses multiple browsers and or multiple devices.
* Portable. Increase privacy and security by hosting it locally, or by hard coding everything into one single html file.
* Prevent duplicates. A single source helps prevent the spread/duplication of files across devices, applications, and directories.
* Self-custody. No ads, no tracking, no third parties.
* No database.
* Super lightweight. Lightening fast load times. No compiling or builds. Minimal PHP script (to edit/write files). It is easily swapped out with another back-end, like Python or Node.
* Search is instantaneous because all the data is on a single page.
* Edit notes directly in the browser or in your favorite text editor.
* Designed for mobile and desktop.
* Keyboard accessible with tabbed navigation.


### Cons
* Basic knowledge of HTML, CSS, and JSON is required.
* A fair amount of traditional front-end web development knowledge is required to set up. Afterwards, the maintenance is trivial and updating notes can be done from the browser.
* Adding new sections and files is still a manual process.
* You must completely trust whoever has access to this site! It would be a _security nightmare_ otherwise.
* Using a code editor is the most powerful experience.
* Once files are encrypted, the only reasonable way to edit them is through the browser.
* Tailored to the organized, meticulous note taker.


## Basic Anatomy

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
    const notes = [
        { "id" : "Groceries", "dir" : "Health/Nutrition/groceries.html" },
        { "id" : "Recipies",  "dir" : "Health/Nutrition/recipies.html" },
        { "id" : "News",      "dir" : "news.html" },
        { "id" : "To-Do",     "dir" : "to-do.html" }
    ];

Notes are asynchronously downloaded and dynamically constructed with javascript, using this `notes` object. The order (of this array) will determine the order on the page.

This config defines the containers for each category of notes based on their directory structure.

The id of each category will be used for the name of each respective note category. Hence, the capitalization. The same is true for the directories.

Once the index file has loaded, the site will check for a locally stored passphrase. If one is not found, a prompt will persist until one is entered. Javascript will decrypt any encrypted sections and the site will be ready.

A passcode cannot be changed after it is used. However, you could copy and paste the unencrypted code back into your files and start over. Using more than one passcode to encrypt data will break the site. Any decryption failures will interrupt the process and launch the passphrase modal again.

**Encryption is using CryptoJS and temporarily storing the passphrase in the browser session storage. This is vulnerable to XSS attacks but is fairly secure otherwise. The main reason for the encryption is to prevent the web-host from snooping. True secrecy would require more.**

Unencrypted notes will have a pink background when useEncryption is enabled. Edit the note from the browser and save to encrypt it. The passphrase in session storage is used to encrypt.

Refer to the browser console for detailed error messages.

Some things, like the local storage of notes, are ongoing experiments. 



## What inspired this specific implementation?

#### Simplicity is divine.

I am toying with the notion of an SFA (Single File Application). A lightweight, highly performant, single purpose variant of the SPA. No frameworks, no dependencies, no bloat.

The latest CSS and JS was leveraged whenever possible because my personal requirements do not include comprehensive backwards compatibility and (to be honest) it's more fun that way.

I am reevaluating the pointer cursor. I had always believed that anything clickable should have a pointer cursor. However, after reading some arguments against it, I've changed my mind. Less is more. The closer to default functionality the better.

"What about all of these files?", you may ask. They are split out to make life easier (see Basic Anatomy). However, this page could easily be converted into a single, static html file including all the content, CSS, and Javascript (inline).



## The Future
I wrote this tool for myself which means future development will be limited to my whimsical desires and needs. This could change with increased interest from additional advocates.   
* Make this easier to use for non-technical folks.
  * Enable updates to config from browser.
  * Enable users to create, delete, and rename the notes in their repository from the browser.
  * Export tool
  * Decryption tool
  * File upload
* Add encryption for images. Probably base-64. Otherwise, linking to external (encrypted) storage is a good solution.
* Explore the PWA options that enable edits to files on local directories...
* Scrape the notes directory to dynamically generate `notes` object.
* Notifications for success and failure.
* View passphrase
* Throttle number of passphrase attempts.
* Use timestamps to help manage overwriting new files and general sync issues.
* Tally calculator
* Create a non-javascript version?
* Maybe just keep this as simple as possible. :)