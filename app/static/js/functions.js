// GLOBAL

const supportsTouchEvents = ( window.DocumentTouch && document instanceof DocumentTouch );
const copyToClipboard = ( snippet ) => {
    navigator.clipboard.writeText( snippet ).then( () => {
        console.log("Copied to clipboard successfully");
    } ); // This only works over localhost or https.
};


// STORAGE

const getStoredChecklistLength = ( key ) => {
    return ( localStorage.getItem( key ) ) ? parseInt( localStorage.getItem( key ) ) : 0;
};
const setChecklistLength = ( key, length ) => {
    if ( key && length ) {
        localStorage.setItem( key, length );
    }
};
const getChecklistHasChanged = ( stored, actual ) => {
    return (stored && stored !== actual);
};
const clearChecklistValues = ( key, list ) => {
    if ( key && list && list.length ) {
        list.forEach( ( item, index ) => {
            localStorage.removeItem( key + '-' + index );
        } );
        console.warn( 'localStorage has been removed.' );
    }
};
const storeChecklistValues = ( key, list ) => {
    if ( key && list && list.length ) {
        list.forEach( ( item, index ) => {
            if ( index > 0 ) {
                localStorage.setItem( key + '-' + index, item.checked );
            }
        });
    }
};
const getStoredValue = ( key, index ) => {
    return (localStorage.getItem(key + '-' + index) === 'true');
};
const setPassphrase = ( p ) => {
    sessionStorage.setItem( 'passphrase', p );
};
const getPassphrase = ( ) => {
    return sessionStorage.getItem( 'passphrase' );
};
const storeNote = ( name, value ) => {
    if ( name && value ) {
        try {
            localStorage.setItem( 'note-' + name, value );
        }
        catch( err ) {
            console.log( 'There was a problem saving to storage.', { err, name, value } );
        }
    } else {
        console.log( 'Name or value is missing.', { name, value } );
    }
};
const getStoredNote = ( name ) => {
    return localStorage.getItem( 'note-' + name );
};
// setItem(key, value);
// getItem(key);
// removeItem(key);
// clear();


// DIALOG

const toggleBodyDialog = ( display, type ) => {
    if ( display ) {
        document.body.classList.remove('dialog');
        if (type) { document.body.classList.remove(type); }
    } else {
        document.body.classList.add('dialog');
        if (type) { document.body.classList.add(type); }
    }
}
const handlePassphrase = ( value ) => {
    if ( value ) {
        setPassphrase( value );
        removePassphraseDialog();
        if ( downloadComplete ) {
            decryptAllNotes();
            appendNotesToMain();
        } else {
            insertProgressBarDialog();
        }
    }
};
const handleDialogEvents = ( e ) => {
    const
        target = e.target,
        id     = target.id,
        key    = e.key,
        btn    = target.closest('button');
    if ( e.repeat || btn && key && key !== "Escape" ) { return } // Enter key fires click and keyup on buttons. This prevents duplicate processing.
    if ( ( btn && btn.id === 'close' ) || ( key === "Escape" && !document.querySelector( '#dialogPassphrase' ) ) ) {
        e.preventDefault();
        removeEditDialog();
    } else if ( !key || key === "Enter" || ( btn && !key ) ) {
        switch ( id ) {
            case 'saveNote':
                e.preventDefault();
                // Get ID of section to repopulate
                const refreshId = target.closest('dialog').getAttribute('data');
                // Show Spinner
                document.querySelector('dialog').classList.add('processing');
                // Get Data. This encrypts the textarea (in the DOM) before getting data for payload.
                const form                   = document.querySelector('form');
                let   textareaValue          = form.querySelector('textarea').value;
                let   textareaValueEncrypted = textareaValue;
                if ( !isEncrypted( textareaValue ) && useEncryption ) {
                    textareaValueEncrypted = encrypt( textareaValue );
                    form.querySelector('textarea').value = textareaValueEncrypted;
                }
                const data = new FormData(document.querySelector('form')); // Use Array.from(data) to view FormData which appears empty.
                saveNote( data )
                    .then( () => {
                        storeNote( id, textareaValueEncrypted );
                        if ( !isDemo && useEncryption ) {
                            document.querySelector( '#' + refreshId + ' .notes__sections' ).innerHTML = decrypt( getStoredNote( id ) );
                        } else {
                            document.querySelector( '#' + refreshId + ' .notes__sections' ).innerHTML = textareaValue;
                        }
                        document.getElementById( refreshId ).open = true;
                        if ( useEncryption ) {
                            document.querySelector('#' + refreshId).classList.remove('not-encrypted');
                        }
                        removeEditDialog();
                    })
                    .catch( error => { console.error( 'saveNote', { error } ) });
                break;
            case 'copyToClipboardSection':
                e.preventDefault();
                e.stopPropagation();
                copyToClipboard( section );
                break;
            case 'copyToClipboardListItem':
                e.preventDefault();
                e.stopPropagation();
                copyToClipboard( listItem );
                break;
            case 'copyToClipboardListItemCode':
                e.preventDefault();
                e.stopPropagation();
                copyToClipboard( listItemCode );
                break;
            case 'copyToClipboardListItemBookmark':
                e.preventDefault();
                e.stopPropagation();
                copyToClipboard( listItemBookmark );
                break;
            case 'submitPassphrase':
                e.preventDefault();
                const input = document.querySelector('#dialogPassphrase input');
                if ( input.value ) {
                    handlePassphrase( input.value );
                } else {
                    input.focus();
                }
                break;
            case 'passphrase':
                e.preventDefault();
                if ( key === "Enter" ) {
                    const input = document.querySelector('#dialogPassphrase input');
                    if ( input.value ) {
                        handlePassphrase( input.value );
                    } else {
                        input.focus();
                    }
                }
                break;
            default:
                break;
        }
    }
};
const addDialogEventListeners = (modal) => {
    if ( supportsTouchEvents ) {
        // Avoid double clicks in mobile. This covers tap, pencil, mouse, and keyboard in iOS.
        modal.addEventListener( 'touchend', ( e ) => { handleDialogEvents( e ) } );
    }  else {
        modal.addEventListener( 'click', ( e ) => { handleDialogEvents( e ) } );
        modal.addEventListener( 'keyup', ( e ) => { handleDialogEvents( e ) } );
    }
}
const insertEditDialog = ( content, dir, id, title, lastModified ) => {
    if ( !document.getElementById('dialogEdit') ) {
        const templateDialogEdit = document.getElementById('templateDialogEdit');
        let fragment = templateDialogEdit.content.cloneNode(true);
        let dialog = fragment.querySelector('dialog');
        dialog.setAttribute('data', id);
        if (content) {
            let textarea = dialog.querySelector('#dialogEditTextArea');
            if (isEncrypted(content)) {
                content = decrypt(content);
            }
            textarea.appendChild(document.createTextNode(content));
        }
        let h2 = dialog.querySelector('h2');
        h2.replaceChild(document.createTextNode(title.replace('-', ' ')), h2.childNodes[0]);
        let small = dialog.querySelector('small');
        const lastModifiedDate = (new Date(lastModified).toLocaleString() !== 'Invalid Date') ? new Date(lastModified).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'medium'
        }) : '';
        small.appendChild(document.createTextNode(lastModifiedDate));
        dialog.querySelector('input[name="url"]').value = dir;
        addDialogEventListeners(dialog);
        toggleBodyDialog(false, 'edit');
        document.body.prepend(fragment);
        const eventFocus = new Event('focus');
        dialog.querySelector('#dialogEdit textarea').focus();
        dialog.querySelector('#dialogEdit textarea').dispatchEvent(eventFocus);
    }
};
const removeEditDialog = () => {
    document.getElementById('dialogEdit').remove();
    toggleBodyDialog(true);
};
const insertPassphraseDialog = () => {
    clearMainNotes();
    const templateDialogPassphrase = document.getElementById('templateDialogPassphrase');
    const fragment = templateDialogPassphrase.content.cloneNode( true );
    const dialog = fragment.querySelector( 'dialog' );
    addDialogEventListeners( dialog );
    toggleBodyDialog(false);
    document.body.prepend( fragment );
    document.querySelector('dialog input').focus();
};
const removePassphraseDialog = () => {
    document.getElementById('dialogPassphrase').remove();
    toggleBodyDialog(true);
};
const insertProgressBarDialog = () => {
    const templateProgressBar = document.getElementById('templateDialogProgressBar');
    const fragment = templateProgressBar.content.cloneNode( true );
    toggleBodyDialog(false);
    document.body.prepend( fragment );
    document.getElementById('dialogProgressBar').open = true;
};
const removeProgressBarDialog = () => {
    document.getElementById('dialogProgressBar').remove();
    toggleBodyDialog(true);
};
const section = `
<section class="note__section">
  <h3></h3>
  <p></p>
  <ul>
    <li></li>
    <li></li>
    <li></li>
  </ul>
</section>`;
const listItem         = `<li></li>`;
const listItemCode     = `<li><button class="code"></button></li>`;
const listItemBookmark = `<li><a href="" target="_blank" rel="noreferrer"></a></li>`;


// MAIN

const setupMainEvents = () => {
    if ( supportsTouchEvents ) {
        // Avoid double clicks in mobile. This covers tap, pencil, mouse, and keyboard in iOS.
        main.addEventListener('touchend', ( e ) => { handleMainEvents( e ); } );
    } else {
        main.addEventListener('click', ( e ) => { handleMainEvents( e ); });
    }
};
const main = document.getElementsByTagName('main')[0];
const handleMainEvents = ( e ) => {
    let
        target = e.target,
        id     = '',
        dir    = '',
        title  = '',
        key    = e.key,
        btn    = target.closest('button'),
        code   = ( target.closest('code') || e.tagName === 'code' ||  target.classList.contains('code')),
        label  = target.closest('label');
    if ( !key || key === "Enter" ) {
        if ( btn && btn.className === 'notes__button' ) {
            // Edit Node
            e.preventDefault();
            e.stopPropagation();
            title = btn.title;
            id    = ( target.closest('details') ) ? target.closest('details').id : '';
            dir   = notesDirectory + notes.filter( ( note ) => { return note.id === id } )[0].dir;
            // Pull from storage be default?
            // Check whether storage or server is newer?
            getNote( dir )
                .then( data => {
                    insertEditDialog( data.content, dir, id, title, data.lastModified );
                })
                .catch( error => {
                    console.error( 'getNote', { error } );
                    // Get from local storage instead.
                    const note    = notes.filter( ( note ) => { return note.id === id } );
                    const content = getStoredNote( id );
                    insertEditDialog( content, note[0].dir, note[0].id, title, '' );
                });
        } else if ( btn && btn.className === 'select-all' ) {
            // Checklist
            e.preventDefault();
            selectAll( btn.closest('section') );
        } else if ( btn && btn.className === 'deselect-all' ) {
            // Checklist
            e.preventDefault();
            deselectAll( btn.closest('section') );
        } else if ( label && label.className === 'view-checked' ) {
            // Checklist
            const isViewChecked = ( label.querySelector('input').checked );
            viewChecked( target.closest('section'), isViewChecked );
        } else if ( code ) {
            if ( btn ) {
                copyToClipboard( btn.innerHTML );
            } else {
                copyToClipboard( code.innerHTML );
            }
        } else if ( label ) {
            // Checklist
            e.stopPropagation();
            const section = target.closest('section');
            if ( section.querySelector('.cl__section input').checked ) {
                viewChecked( section, true );
            } else {
                viewChecked( section, false );
            }
            storeChecklistValues( 'groceriesChecklist', getChecklist( document.getElementById('Groceries') ) );
        }
    }
    setTimeout( () => {
        // Wait for the DOM to update before details check.
        if ( main.querySelector('details[open]') ) {
            updateButtonAction( 'collapse' );
        } else {
            updateButtonAction( 'expand' );
        }
    }, 0 );
};


// NAVBAR

const navbarController   = document.querySelector('.nav__ctrl');
const getDetailsArray    = () => { return Array.from( document.getElementsByTagName( 'details' ) ) };
const detailsState       = ( s ) => { getDetailsArray().forEach( ( item) => { item.open = ( s === 'expand' ) } ); }
const updateButtonAction = ( action ) => {
    const navbarButton = navbarController.querySelector('.nav__ctrl-button');
    switch ( action ) {
        case 'collapse' :
            navbarButton.classList.remove( 'expand' );
            navbarButton.classList.add( 'collapse' );
            navbarButton.setAttribute( 'title', 'Collapse All');
            navbarButton.querySelector('span').innerText = 'Collapse All';
            break;
        case 'expand':
            navbarButton.classList.add( 'expand' );
            navbarButton.classList.remove( 'collapse' );
            navbarButton.setAttribute( 'title', 'Expand All');
            navbarButton.querySelector('span').innerText = 'Expand All';
            break;
    }
};
const handleNavbarButtonEvents = ( action ) => {
    switch ( action ) {
        case 'expand':
            detailsState( 'expand' );
            updateButtonAction( 'collapse' );
            break;
        case 'collapse':
            detailsState( 'collapse' );
            updateButtonAction( 'expand' );
            break;
        default:
            break;
    }
};
const filterNavbarTarget = ( e ) => {
    const
        target = e.target,
        btn    = target.closest('button'),
        action = ( btn && btn.classList.contains( 'expand' ) ) ? 'expand' : 'collapse';
    if ( btn ) {
        e.preventDefault();
        handleNavbarButtonEvents( action );
    }
};
const setupNavbarControllerEvents = () => {
    if ( supportsTouchEvents ) {
        // Avoid double clicks in mobile. This covers tap, pencil, mouse, and keyboard in iOS.
        navbarController.addEventListener( 'touchend', ( e ) => { filterNavbarTarget( e ) } );
    } else {
        navbarController.addEventListener( 'click', ( e ) => { filterNavbarTarget( e ) } );
    }
};


// ASYNC

async function getNote( dir ) {
    // last-modified response header does not work when deployed locally on localhost.
    // If the date is necessary on local deployment, then use php (previous implementation).
    // This is nice to have but not very useful.
    const response     = await fetch( dir );
    const content      = await response.text();
    const lastModified = await ( response.headers.get('last-modified') ) ? Date.parse( response.headers.get('last-modified') ) : '';
    return { content, lastModified };
}
async function saveNote( data ) {
    return await fetch('save-note', { method: 'POST', body: data });
}


// ENCRYPTION

const encrypt = ( data ) => {
    let encryptedData = "";
    try {
        encryptedData = CryptoJS.AES.encrypt( data, getPassphrase() );
    }
    catch( e ) {
        console.error( 'Encrypt', { e } );
    }
    return encryptedData ;
};
const decrypt = ( data ) => {
    let decryptedData = "";
    try {
        decryptedData = CryptoJS.AES.decrypt( data, getPassphrase() ).toString( CryptoJS.enc.Utf8 );
    }
    catch( e ) {
        console.error( 'Decrypt', { e } );
    }
    return decryptedData;
};
const isEncrypted = ( data ) => {
    return ( data.substring(0,3) === 'U2F' );
};


// NOTES

const mainNotes             = document.querySelector('main.notes');
const templateNavController = document.getElementById('templateNavController');
let fragmentNotes           = new DocumentFragment();
let decryptionFailed        = false;
let downloadTally           = 0;
let downloadComplete        = false;
const clearMainNotes = () => {
    mainNotes.innerHTML = '';
    document.querySelector('.nav__ctrl').innerHTML = '';
};
const getDetailsFragment = ( id, directory ) => {
    const templateNoteDetails = document.querySelector('#templateNoteDetails');
    const fragmentNoteDetails = templateNoteDetails.content.cloneNode( true );
    const details             = fragmentNoteDetails.querySelector( 'details' );
    const detailsSummarySpan  = details.querySelector('.notes__details summary strong');
    details.id = id;
    detailsSummarySpan.innerHTML = id.replace('-', ' ');
    if ( !directory ) {
        const templateNoteSummaryButton = document.querySelector('#templateNoteSummaryButton');
        const templateNoteSections      = document.querySelector('#templateNoteSections');
        const fragmentNoteSummaryButton = templateNoteSummaryButton.content.cloneNode( true );
        const fragmentNoteSections      = templateNoteSections.content.cloneNode( true );
        fragmentNoteSummaryButton.querySelector( 'button' ).setAttribute( 'title', 'Edit ' + id );
        details.querySelector( '.notes__details summary' ).appendChild( fragmentNoteSummaryButton );
        details.appendChild( fragmentNoteSections );
    }
    return fragmentNoteDetails;
};
const constructDetails = ( note ) => {
    const directories       = note.dir.split( '/' );
    const directoriesLength = directories.length;
    const noDirectories     = (directories.length === 1);
    if ( noDirectories) {
        fragmentNotes.appendChild( getDetailsFragment( note.id, false ) );
    } else {
        for ( let i = 0; i < directoriesLength - 1; i += 1 ) {
            const id = directories[i];
            if ( fragmentNotes.querySelector( 'details#' + id ) === null ) {
                if ( i < 1 ) {
                    fragmentNotes.appendChild( getDetailsFragment( id, true ) );
                } else {
                    fragmentNotes.querySelector( 'details#' + directories[ i - 1 ] ).appendChild( getDetailsFragment( id, true ) );
                }
            }
        }
        fragmentNotes.querySelector( 'details#' + directories[ directoriesLength - 2 ] ).appendChild( getDetailsFragment( note.id, false ) );
    }
};
const insertNote = ( note ) => {
    try {
        if ( note && note.id && fragmentNotes.querySelector( '#' + note.id + ' .notes__sections' ) ) {
            fragmentNotes.querySelector( '#' + note.id + ' .notes__sections' ).innerHTML = getStoredNote(note.id);
        } else {
            console.error( 'insertNote', { note, 'note.id' : note.id, '.notes__sections' : fragmentNotes.querySelector( '#' + note.id + ' .notes__sections' ) } );
        }
    }
    catch( error ) {
        console.error( 'insertNote', { error } );
    }
};
const decryptNote = ( note ) => {
    const storedNote = getStoredNote( note.id );
    const isStoredNoteEncrypted = isEncrypted( storedNote );
    if ( isStoredNoteEncrypted ) {
        const decryptedNote = decrypt( storedNote );
        if ( decryptedNote ) {
            fragmentNotes.querySelector('#' + note.id + ' .notes__sections').innerHTML = decryptedNote;
        } else {
            // Decryption failed.
            decryptionFailed = true;
        }
    } else {
        fragmentNotes.querySelector('#' + note.id).classList.add('not-encrypted');
    }
};
const decryptAllNotes = () => {
    decryptionFailed = false;
    if ( useEncryption ) {
        notes.forEach( ( note ) => {
            if ( !decryptionFailed ) {
                decryptNote( note );
            }
        });
        if ( decryptionFailed ) {
            clearMainNotes();
            insertPassphraseDialog();
        }
    }
};
const appendNotesToMain = () => {
    if ( ( useEncryption && !decryptionFailed ) || !useEncryption ) {
        mainNotes.appendChild(fragmentNotes);
        document.querySelector('.nav__ctrl').appendChild(templateNavController.content.cloneNode(true));
        initChecklist('Groceries');
    }
};
const downloadProgress = () => {
    const progressIncrement = 100 / notes.length;
    const progress          = document.querySelector('#dialogProgressBar progress');
    const small             = document.querySelector('#dialogProgressBar small');
    if ( progress ) {
        progress.value += progressIncrement;
        const percent = Math.round(progress.value).toString() + '%';
        progress.innerHTML = percent;
        small.innerHTML    = percent;
    }
    downloadTally += 1;
    downloadComplete = ( downloadTally === notes.length );
    if ( downloadComplete ) {
        if ( ( useEncryption && getPassphrase() ) || !useEncryption || isDemo ) {
            removeProgressBarDialog();
            decryptAllNotes();
            appendNotesToMain();
        }
    }
};
const importStoreInsertAllNotes = () => {
    fragmentNotes    = new DocumentFragment();
    downloadTally    = 0;
    downloadComplete = false;
    decryptionFailed = false;
    clearMainNotes();
    if ( useEncryption && !getPassphrase() ) {
        insertPassphraseDialog();
    } else {
        insertProgressBarDialog();
    }
    notes.forEach(( note ) => {
        constructDetails( note );
        // Get each note individually and store its contents.
        getNote(notesDirectory + note.dir)
            .then(data => {
                storeNote(note.id, data.content);
                insertNote(note);
                downloadProgress(note);
            })
            .catch(error => {
                console.error('getNote', { error, 'dir' : notesDirectory + note.dir } )
            });
    });
};



// CHECKLIST

let CHECKLIST        = '';
let CHECKLIST_LENGTH = '';
const getChecklist = ( container ) => {
    return ( container ) ? Array.from( container.querySelectorAll('input') ) : [];
};
const initChecklist = ( id ) => {
    CHECKLIST                   = id.toLowerCase() + 'Checklist';
    CHECKLIST_LENGTH            = id.toLowerCase() + 'ChecklistLength';
    const checklistContainer    = document.getElementById( id );
    const checklist             = getChecklist( checklistContainer );
    const storedChecklistLength = ( getStoredChecklistLength( CHECKLIST_LENGTH ) ) ? getStoredChecklistLength( CHECKLIST_LENGTH ) : 0;
    const checklistHasChanged   = getChecklistHasChanged( storedChecklistLength, checklist.length );
    try {
        if ( checklistHasChanged ) {
            // The number of inputs has changed. Reset storage.
            clearChecklistValues( CHECKLIST, checklistContainer );
            setChecklistLength( CHECKLIST_LENGTH, checklist.length );
            storeChecklistValues( CHECKLIST, checklist );
        } else if ( !storedChecklistLength ) {
            // Values were never set.
            setChecklistLength( CHECKLIST_LENGTH, checklist.length );
            storeChecklistValues( CHECKLIST, checklist );
        } else {
            // Update DOM with correct checked values.
            checklist.forEach( ( item, index ) => {
                item.checked = getStoredValue( CHECKLIST, index );
            } );
        }
    } catch( error ) {
        console.error( 'initChecklist', { error, CHECKLIST, CHECKLIST_LENGTH, checklistContainer, checklist, storedChecklistLength, checklistHasChanged } );
    }
};
const viewChecked = ( section, checked ) => {
    const checklist = getChecklist( section );
    try {
        checklist.forEach( ( item, index ) => {
            const label = item.closest('label');
            if ( checked ) {
                if ( index > 0 ) {
                    if ( item.checked ) {
                        label.classList.remove('hide');
                    } else {
                        label.classList.add('hide');
                    }
                }
            } else {
                if ( index > 0 ) {
                    label.classList.remove('hide');
                }
            }
        } );
    } catch ( error ) {
        console.error( 'viewChecked', { error, checklist } );
    }
};
const selectAll = ( section ) => {
    const checklist = getChecklist( section );
    try {
        checklist.forEach( ( item, index ) => {
            if ( index > 0 ) {
                item.checked = true;
            }
        } );
        section.querySelector('.cl__section input').checked = false;
        viewChecked( section, false );
        storeChecklistValues( CHECKLIST, checklist );
    } catch ( error ) {
        console.error( 'selectAll', { error, checklist } );
    }
};
const deselectAll = ( section ) => {
    const checklist = getChecklist( section );
    try {
        checklist.forEach( ( item, index ) => {
            if ( index > 0 ) {
                item.checked = false;
            }
        } );
        section.querySelector('.cl__section input').checked = false;
        viewChecked( section, false );
        storeChecklistValues( CHECKLIST, checklist );
    } catch ( error ) {
        console.error( 'deselectAll', { error, checklist } );
    }
};


// INIT

importStoreInsertAllNotes();
setupMainEvents();
setupNavbarControllerEvents();
// Register the service worker
if ('serviceWorker' in navigator) {
    // Wait for the 'load' event to not block other work
    window.addEventListener('load', async () => {
        // Try to register the service worker.
        try {
            const reg = await navigator.serviceWorker.register('/service-worker.js');
            // console.log('Service worker registered! 😎', reg);
        } catch (err) {
            // console.log('😥 Service worker registration failed: ', err);
        }
    });
}


// These sections were previously separated into javascript modules.
// They are combined into one file to reduce server requests, to maintain portability, to simplify updates, and to avoid build/compilation scripts.