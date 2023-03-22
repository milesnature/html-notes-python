const supportsTouchEvents = (window.DocumentTouch && document instanceof DocumentTouch);
const copyToClipboard = (snippet) => {
    navigator.clipboard.writeText(snippet).then(() => {
        console.log("Copied to clipboard successfully");
    }); // This only works over localhost or https.
};

const storage = {
    getStoredChecklistLength: (key) => {
        return (localStorage.getItem(key)) ? parseInt(localStorage.getItem(key)) : 0;
    },
    setChecklistLength: (key, length) => {
        if (key && length) {
            localStorage.setItem(key, length);
        }
    },
    getHasChanged: (stored, actual) => {
        return (stored && stored !== actual);
    },
    clearChecklistValues: (key, list) => {
        if (key && list && list.length) {
            list.forEach((item, index) => {
                localStorage.removeItem(key + '-' + index);
            });
            console.warn('localStorage has been removed.');
        }
    },
    storeChecklistValues: (key, list) => {
        if (key && list && list.length) {
            list.forEach((item, index) => {
                if (index > 0) {
                    localStorage.setItem(key + '-' + index, item.checked);
                }
            });
        }
    },
    getStoredValue: (key, index) => {
        return (localStorage.getItem(key + '-' + index) === 'true');
    },
    setPassphrase: (p) => {
        sessionStorage.setItem('passphrase', p);
    },
    getPassphrase: () => {
        return sessionStorage.getItem('passphrase');
    },
    storeNote: (name, value) => {
        if (name && value) {
            try {
                localStorage.setItem('note-' + name, value);
            } catch (err) {
                console.error('There was a problem saving to storage.', {err, name, value});
            }
        } else {
            console.error('Name or value is missing.', {name, value});
        }
    },
    getStoredNote: (name) => {
        return localStorage.getItem('note-' + name);
    },
    removeNote: (name) => {
        if (name) {
            try {
                localStorage.removeItem('note-' + name);
            } catch (err) {
                console.log('There was a problem deleting this note.', {err, name});
            }
        } else {
            console.log('Name was missing.', {name});
        }
    }
    // setItem(key, value);
    // getItem(key);
    // removeItem(key);
    // clear();
};

const dialog = {
    toggleBodyDialog: (display, type, id) => {
        if (display) {
            document.getElementsByTagName("html")[0].classList.add('dialog');
            if (type) {
                document.body.classList.add(type);
            }
        } else {
            document.getElementsByTagName("html")[0].classList.remove('dialog');
            if (type) {
                document.body.classList.remove(type);
            }
            if (id) {
                document.getElementById(id).scrollIntoView(true);
                document.querySelector('#' + id + ' summary').focus();
            }
        }
    },
    removeDialog: () => {
        if (document.getElementById('dialogEdit')) {
            dialog.removeEdit();
        } else if (document.getElementById('dialogSetup')) {
            dialog.removeSetup();
        }
    },
    handleDocumentEvents: (e) => {
        const key = e.key;
        if (key === "Escape") {
            e.preventDefault();
            dialog.removeDialog();
            main.removeSelectedClass();
        }
    },
    setupDocumentEvents: () => {
        document.addEventListener('keyup', (e) => {
            dialog.handleDocumentEvents(e)
        });
    },
    handlePassphrase: (value) => {
        if (value) {
            storage.setPassphrase(value);
            dialog.removePassphrase();
            if (notes.downloadComplete) {
                notes.decryptAllNotes();
                notes.appendNotesToMain();
            } else {
                dialog.insertProgressBar();
            }
        }
    },
    refreshNotes: () => {
        notes.notesArray = [];
        notes.clearMainNotes();
        notes.init();
    },
    handleEventsPassphrase: () => {
        const input = document.querySelector('#dialogPassphrase input');
        const error = document.querySelector('#dialogPassphrase .error');
        if (input.value) {
            error.innerHTML = '';
            error.classList.remove('show');
            dialog.handlePassphrase(input.value);
        } else {
            error.innerHTML = 'Please renter your passphrase.';
            error.classList.add('show');
            input.focus();
        }
    },
    handleEventsCreate: () => {
        const data = new FormData(document.getElementById('createForm')); // Use Array.from(data) to view FormData which appears empty.
        const createForm = document.querySelector('#createForm');
        const createFormInput = createForm.querySelector('#createForm input');
        const createFormError = createForm.querySelector('#createForm .error');
        if (!createForm.classList.contains('processing')) {
            (async () => {
                let response = {};
                try {
                    createForm.classList.add('processing');
                    createFormError.innerHTML = '';
                    createFormError.classList.remove('show');
                    response = await createNote(data);
                    const code = parseInt(response.code);
                    if (code === 200) {
                        dialog.refreshNotes();
                        dialog.removeSetup();
                    } else if (code > 200) {
                        createForm.classList.remove('processing');
                        createFormError.innerHTML = response.message;
                        createFormError.classList.add('show');
                        createFormInput.focus();
                        console.error(response);
                    }
                } catch (e) {
                    createFormError.innerHTML = e;
                    createFormError.classList.add('show');
                    createFormInput.focus();
                    console.error(e);
                }
            })();
        }
    },
    handleEventsDelete: () => {
        const data = new FormData(document.getElementById('deleteForm')); // Use Array.from(data) to view FormData which appears empty.
        const deleteForm = document.querySelector('#deleteForm');
        const deleteFormInput = deleteForm.querySelector('#deleteForm input');
        const deleteFormError = deleteForm.querySelector('#deleteForm .error');
        if (!deleteForm.classList.contains('processing')) {
            (async () => {
                let response = {};
                try {
                    deleteForm.classList.add('processing');
                    deleteFormError.innerHTML = '';
                    deleteFormError.classList.remove('show');
                    response = await deleteNote(data);
                    const code = parseInt(response.code);
                    if (code === 200) {
                        dialog.refreshNotes();
                        dialog.removeSetup();
                    } else if (code > 200) {
                        deleteForm.classList.remove('processing');
                        deleteFormError.innerHTML = response.message;
                        deleteFormError.classList.add('show');
                        deleteFormInput.focus();
                        console.error(response);
                    }
                } catch (e) {
                    deleteFormError.innerHTML = e;
                    deleteFormError.classList.add('show');
                    deleteFormInput.focus();
                    console.error(response);
                }
            })();
        }
    },
    handleEvents: (e) => {
        const target = e.target;
        const btn = target.closest('button');
        const key = e.key;
        let id;
        let refreshId;
        let form;
        let data;
        if (target.id) {
            id = target.id;
        } else if (btn && btn.id) {
            id = btn.id;
        }
        if (e.repeat || btn && key) {
            return
        } // Enter key fires click and keyup on buttons. This prevents duplicate processing.
        if (btn && btn.className === 'close') {
            e.preventDefault();
            dialog.removeDialog();
        } else if (!key || key === "Enter" || (btn && !key)) {
            switch (id) {
                case 'saveNote':
                    e.preventDefault();
                    e.stopPropagation();
                    // Get ID of section to repopulate
                    refreshId = target.closest('dialog').getAttribute('data');
                    // Show Spinner
                    document.querySelector('dialog').classList.add('processing');
                    // Get Data. This encrypts the textarea (in the DOM) before getting data for payload.
                    form = document.querySelector('form');
                    let textareaValue = form.querySelector('textarea').value;
                    let textareaValueEncrypted = textareaValue;
                    if (!encryption.isEncrypted(textareaValue) && useEncryption) {
                        textareaValueEncrypted = encryption.encrypt(textareaValue);
                        form.querySelector('textarea').value = textareaValueEncrypted;
                    }
                    data = new FormData(document.querySelector('form')); // Use Array.from(data) to view FormData which appears empty.
                    (async () => {
                        try {
                            let response = await saveNote(data);
                            const code = parseInt(response.code);
                            if (code === 200) {
                                storage.storeNote(id, textareaValueEncrypted);
                                if (!isDemo && useEncryption) {
                                    document.querySelector('#' + refreshId + ' .notes__sections').innerHTML = encryption.decrypt(storage.getStoredNote(id));
                                } else {
                                    document.querySelector('#' + refreshId + ' .notes__sections').innerHTML = textareaValue;
                                }
                                const updatedElement = document.getElementById(refreshId);
                                updatedElement.open = true;
                                if (useEncryption) {
                                    updatedElement.classList.remove('not-encrypted');
                                }
                                dialog.removeEdit(refreshId);
                            } else if (code > 200) {
                                console.error(response);
                            }
                        } catch (e) {
                            console.error(e);
                        }
                    })();
                    break;
                case 'createNote':
                    e.preventDefault();
                    e.stopPropagation();
                    dialog.handleEventsCreate();
                    break;
                case 'createNoteInput':
                    e.preventDefault();
                    e.stopPropagation();
                    if (key === "Enter") {
                        dialog.handleEventsCreate();
                    }
                    break;
                case 'deleteNote':
                    e.preventDefault();
                    e.stopPropagation();
                    dialog.handleEventsDelete();
                    break;
                case 'deleteNoteInput':
                    e.preventDefault();
                    e.stopPropagation();
                    if (key === "Enter") {
                        dialog.handleEventsDelete();
                    }
                    break;
                case 'copyToClipboardSection':
                    e.preventDefault();
                    e.stopPropagation();
                    copyToClipboard(dialog.section);
                    break;
                case 'copyToClipboardListItem':
                    e.preventDefault();
                    e.stopPropagation();
                    copyToClipboard(dialog.listItem);
                    break;
                case 'copyToClipboardListItemCode':
                    e.preventDefault();
                    e.stopPropagation();
                    copyToClipboard(dialog.listItemCode);
                    break;
                case 'copyToClipboardListItemBookmark':
                    e.preventDefault();
                    e.stopPropagation();
                    copyToClipboard(dialog.listItemBookmark);
                    break;
                case 'copyToClipboardTimeStamp':
                    e.preventDefault();
                    e.stopPropagation();
                    copyToClipboard(dialog.timeStamp);
                    break;
                case 'submitPassphrase':
                    e.preventDefault();
                    e.stopPropagation();
                    dialog.handleEventsPassphrase();
                    break;
                case 'passphrase':
                    e.preventDefault();
                    e.stopPropagation();
                    if (key === "Enter") {
                        dialog.handleEventsPassphrase();
                    }
                    break;
                default:
                    break;
            }
        }
    },
    addEventListeners: (modal) => {
        if (supportsTouchEvents) {
            // Avoid double clicks in mobile. This covers tap, pencil, mouse, and keyboard in iOS.
            modal.addEventListener('touchend', (e) => {
                dialog.handleEvents(e)
            });
        } else {
            modal.addEventListener('click', (e) => {
                dialog.handleEvents(e)
            });
            modal.addEventListener('keyup', (e) => {
                dialog.handleEvents(e)
            });
        }
        modal.addEventListener('submit', (e) => {
            e.preventDefault();
        });
        dialog.setupDocumentEvents();
    },
    insertEdit: (content, dir, id, title, lastModified) => {
        if (!document.getElementById('dialogEdit')) {
            const templateDialogEdit = document.getElementById('templateDialogEdit');
            let fragment = templateDialogEdit.content.cloneNode(true);
            let d = fragment.querySelector('dialog');
            d.setAttribute('data', id);
            if (content) {
                let textarea = d.querySelector('#dialogEditTextArea');
                if (encryption.isEncrypted(content)) {
                    content = encryption.decrypt(content);
                }
                textarea.appendChild(document.createTextNode(content));
            }
            let h2 = d.querySelector('h2');
            h2.replaceChild(document.createTextNode(title.replace('-', ' ')), h2.childNodes[0]);
            let time = d.querySelector('time');
            const lastModifiedDate = (new Date(lastModified).toLocaleString() !== 'Invalid Date') ? new Date(lastModified).toLocaleString('en-US', {
                dateStyle: 'medium',
                timeStyle: 'medium'
            }) : '';
            time.appendChild(document.createTextNode(lastModifiedDate));
            d.querySelector('input[name="url"]').value = dir;
            dialog.addEventListeners(d);
            dialog.toggleBodyDialog(true, 'edit');
            document.body.prepend(fragment);
            window.scrollTo(0, 0);
            const eventFocus = new Event('focus');
            d.querySelector('#dialogEdit textarea').focus();
            d.querySelector('#dialogEdit textarea').dispatchEvent(eventFocus);
        }
    },
    removeEdit: (id) => {
        document.getElementById('dialogEdit').remove();
        main.removeSelectedClass();
        dialog.toggleBodyDialog(false, 'edit', id);
    },
    insertSetup: () => {
        if (!document.getElementById('dialogEdit')) {
            const templateDialogSetup = document.getElementById('templateDialogSetup');
            let fragment = templateDialogSetup.content.cloneNode(true);
            let d = fragment.querySelector('dialog');
            dialog.addEventListeners(d);
            dialog.toggleBodyDialog(true, 'setup');
            document.body.prepend(fragment);
            window.scrollTo(0, 0);
            d.querySelector('input').focus();
        }
    },
    removeSetup: () => {
        document.getElementById('dialogSetup').remove();
        dialog.toggleBodyDialog(false, 'setup');
    },
    insertPassphrase: (err) => {
        notes.clearMainNotes();
        const templateDialogPassphrase = document.getElementById('templateDialogPassphrase');
        const fragment = templateDialogPassphrase.content.cloneNode(true);
        const d = fragment.querySelector('dialog');
        dialog.addEventListeners(d);
        dialog.toggleBodyDialog(true);
        document.body.prepend(fragment);
        document.querySelector('#dialogPassphrase input').focus();
        if (err) {
            const error = document.querySelector('#dialogPassphrase .error');
            error.innerHTML = 'Please renter your passphrase.';
            error.classList.add('show');
        }
    },
    removePassphrase: () => {
        document.getElementById('dialogPassphrase').remove();
        dialog.toggleBodyDialog(false);
    },
    insertProgressBar: () => {
        const templateProgressBar = document.getElementById('templateDialogProgressBar');
        const fragment = templateProgressBar.content.cloneNode(true);
        dialog.toggleBodyDialog(true);
        document.body.prepend(fragment);
        document.getElementById('dialogProgressBar').open = true;
    },
    removeProgressBar: () => {
        document.getElementById('dialogProgressBar').remove();
        dialog.toggleBodyDialog(false);
    },
    section: `
<section class="note__section">
  <h3></h3>
  <p></p>
  <ul>
    <li></li>
    <li></li>
    <li></li>
  </ul>
</section>`,
    listItem: `<li></li>`,
    listItemCode: `<li><button class="code"></button></li>`,
    listItemBookmark: `<li><a href="" target="_blank" rel="noreferrer"></a></li>`,
    timeStamp: `<time>` + new Date().toLocaleString('en-US', {dateStyle: 'short', timeStyle: 'short'}) + `</time>`
};

const main = {
    el : document.getElementsByTagName('main')[0],
    removeSelectedClass : () => {
        const selected = document.querySelector('.selected');
        if (selected) {
            selected.classList.remove('selected');
        }
    },
    handleEvents : (e) => {
        let
            target = e.target,
            id = '',
            dir = '',
            title = '',
            key = e.key,
            btn = target.closest('button'),
            code = (target.closest('code') || e.tagName === 'code' || target.classList.contains('code')),
            label = target.closest('label');
        if (!key || key === "Enter") {
            if (btn && btn.className === 'notes__button') {
                // Edit Node
                e.preventDefault();
                e.stopPropagation();
                title = btn.title;
                id = (target.closest('details')) ? target.closest('details').id : '';
                dir = notesDirectory + notes.notesArray.filter((note) => {
                    return note.id === id
                })[0].dir;
                btn.classList.add('selected');
                // Pull from storage be default?
                // Check whether storage or server is newer?
                getNote(dir)
                    .then(data => {
                        dialog.insertEdit(data.content, dir, id, title, data.lastModified);
                        main.removeSelectedClass();
                    })
                    .catch(error => {
                        console.error('getNote', {error});
                        // Get from local storage instead.
                        const note = notes.notesArray.filter((note) => {
                            return note.id === id
                        });
                        const content = storage.getStoredNote(id);
                        dialog.insertEdit(content, note[0].dir, note[0].id, title, '');
                    });
            } else if (btn && btn.className === 'select-all') {
                // Checklist
                e.preventDefault();
                checklist.selectAll(btn.closest('section'));
            } else if (btn && btn.className === 'deselect-all') {
                // Checklist
                e.preventDefault();
                checklist.deselectAll(btn.closest('section'));
            } else if (label && label.className === 'view-checked') {
                // Checklist
                const isViewChecked = (label.querySelector('input').checked);
                checklist.viewChecked(target.closest('section'), isViewChecked);
            } else if (code) {
                if (btn) {
                    copyToClipboard(btn.innerHTML);
                } else {
                    copyToClipboard(code.innerHTML);
                }
            } else if (label) {
                // Checklist
                e.stopPropagation();
                const section = target.closest('section');
                if (section.querySelector('.cl__section input').checked) {
                    checklist.viewChecked(section, true);
                } else {
                    checklist.viewChecked(section, false);
                }
                storage.storeChecklistValues('groceriesChecklist', checklist.get(document.getElementById('Groceries')));
            }
        }
        setTimeout(() => {
            // Wait for the DOM to update before details check.
            if (main.el.querySelector('details[open]')) {
                navbar.updateButtonAction('collapse');
            } else {
                navbar.updateButtonAction('expand');
            }
        }, 0);
    },
    setupEvents : () => {
        if (supportsTouchEvents) {
            // Avoid double clicks in mobile. This covers tap, pencil, mouse, and keyboard in iOS.
            main.el.addEventListener('touchend', (e) => {
                main.handleEvents(e);
            });
        } else {
            main.el.addEventListener('click', (e) => {
                main.handleEvents(e);
            });
        }
    }
}

const navbar = {
    controller : document.querySelector('.controller'),
    getDetailsArray : () => {
        return Array.from(document.getElementsByTagName('details'))
    },
    detailsState : (s) => {
        navbar.getDetailsArray().forEach((item) => {
            item.open = (s === 'expand')
        });
    },
    updateButtonAction : (action) => {
        const navbarButton = navbar.controller.querySelector('.controller-button');
        switch (action) {
            case 'collapse' :
                navbarButton.classList.remove('expand');
                navbarButton.classList.add('collapse');
                navbarButton.setAttribute('title', 'Collapse All');
                navbarButton.querySelector('span').innerText = 'Collapse All';
                break;
            case 'expand':
                navbarButton.classList.add('expand');
                navbarButton.classList.remove('collapse');
                navbarButton.setAttribute('title', 'Expand All');
                navbarButton.querySelector('span').innerText = 'Expand All';
                break;
        }
    },
    handleEvents : (action) => {
        switch (action) {
            case 'expand':
                navbar.detailsState('expand');
                navbar.updateButtonAction('collapse');
                break;
            case 'collapse':
                navbar.detailsState('collapse');
                navbar.updateButtonAction('expand');
                break;
            default:
                break;
        }
    },
    filterTarget : (e) => {
        const
            target = e.target,
            btn = target.closest('button'),
            action = (btn && btn.classList.contains('expand')) ? 'expand' : 'collapse';
        if (btn) {
            e.preventDefault();
            navbar.handleEvents(action);
        }
    },
    setupEvents : () => {
        if (supportsTouchEvents) {
            // Avoid double clicks in mobile. This covers tap, pencil, mouse, and keyboard in iOS.
            navbar.controller.addEventListener('touchend', (e) => {
                navbar.filterTarget(e)
            });
        } else {
            navbar.controller.addEventListener('click', (e) => {
                navbar.filterTarget(e)
            });
        }
    }
}

const footer = {
    el : document.querySelector('footer'),
    handleEvents : (e) => {
        const
            target = e.target,
            btn = target.closest('button');
        if (btn) {
            e.preventDefault();
            dialog.insertSetup();
        }
    },
    setupEvents : () => {
        if (supportsTouchEvents) {
            // Avoid double clicks in mobile. This covers tap, pencil, mouse, and keyboard in iOS.
            footer.el.addEventListener('touchend', (e) => {
                footer.handleEvents(e)
            });
        } else {
            footer.el.addEventListener('click', (e) => {
                footer.handleEvents(e)
            });
        }
    }
}

async function getDir() {
    const response = await fetch('get-dir');
    const content = await response.text();
    return {content};
}
async function getNote(dir) {
    // last-modified response header does not work when deployed locally on localhost.
    const response = await fetch(dir);
    const content = await response.text();
    const lastModified = await (response.headers.get('last-modified')) ? Date.parse(response.headers.get('last-modified')) : '';
    return {content, lastModified};
}
async function saveNote(data) {
    return (await fetch('save-note', {method: 'POST', body: data})).json();
}
async function createNote(data) {
    return (await fetch('create-note', {method: 'POST', body: data})).json();
}
async function deleteNote(data) {
    return (await fetch('delete-note', {method: 'POST', body: data})).json();
}

const encryption = {
    encrypt : (data) => {
        let encryptedData = "";
        try {
            encryptedData = CryptoJS.AES.encrypt(data, storage.getPassphrase());
        } catch (e) {
            console.error('Encrypt', {e});
        }
        return encryptedData;
    },
    decrypt : (data) => {
        let decryptedData = "";
        try {
            decryptedData = CryptoJS.AES.decrypt(data, storage.getPassphrase()).toString(CryptoJS.enc.Utf8);
        } catch (e) {
            console.error('Decrypt', {e});
        }
        return decryptedData;
    },
    isEncrypted : (data) => {
        return (data.substring(0, 3) === 'U2F');
    }
}

const notes = {
    notesArray : [],
    mainNotes : document.querySelector('main.notes'),
    templateNavController : document.getElementById('templateNavController'),
    templateFooter : document.getElementById('templateFooter'),
    fragmentNotes : new DocumentFragment(),
    decryptionFailed : false,
    downloadTally : 0,
    downloadComplete : false,
    clearMainNotes : () => {
        notes.mainNotes.innerHTML = '';
        document.querySelector('.controller').innerHTML = '';
        document.querySelector('footer').innerHTML = '';
    },
    getDetailsFragment : (id, directory) => {
        const templateNoteDetails = document.querySelector('#templateNoteDetails');
        const fragmentNoteDetails = templateNoteDetails.content.cloneNode(true);
        const details = fragmentNoteDetails.querySelector('details');
        const detailsSummarySpan = details.querySelector('.notes__details summary strong');
        details.id = id;
        detailsSummarySpan.innerHTML = id.replace('-', ' ');
        if (!directory) {
            const templateNoteSummaryButton = document.querySelector('#templateNoteSummaryButton');
            const templateNoteSections = document.querySelector('#templateNoteSections');
            const fragmentNoteSummaryButton = templateNoteSummaryButton.content.cloneNode(true);
            const fragmentNoteSections = templateNoteSections.content.cloneNode(true);
            fragmentNoteSummaryButton.querySelector('button').setAttribute('title', 'Edit ' + id);
            details.querySelector('.notes__details summary').appendChild(fragmentNoteSummaryButton);
            details.appendChild(fragmentNoteSections);
        }
        return fragmentNoteDetails;
    },
    constructDetails : (note) => {
        const directories = note.dir.split('/');
        const directoriesLength = directories.length;
        const noDirectories = (directories.length === 1);
        if (noDirectories) {
            notes.fragmentNotes.appendChild(notes.getDetailsFragment(note.id, false));
        } else {
            for (let i = 0; i < directoriesLength - 1; i += 1) {
                const id = directories[i];
                if (notes.fragmentNotes.querySelector('details#' + id) === null) {
                    if (i < 1) {
                        notes.fragmentNotes.appendChild(notes.getDetailsFragment(id, true));
                    } else {
                        notes.fragmentNotes.querySelector('details#' + directories[i - 1]).appendChild(notes.getDetailsFragment(id, true));
                    }
                }
            }
            notes.fragmentNotes.querySelector('details#' + directories[directoriesLength - 2]).appendChild(notes.getDetailsFragment(note.id, false));
        }
    },
    insertNote : (note) => {
        try {
            if (note && note.id && notes.fragmentNotes.querySelector('#' + note.id + ' .notes__sections')) {
                notes.fragmentNotes.querySelector('#' + note.id + ' .notes__sections').innerHTML = storage.getStoredNote(note.id);
            } else {
                console.error('insertNote', {
                    note,
                    'note.id': note.id,
                    '.notes__sections': notes.fragmentNotes.querySelector('#' + note.id + ' .notes__sections')
                });
            }
        } catch (error) {
            console.error('insertNote', {error});
        }
    },
    decryptNote : (note) => {
        const storedNote = storage.getStoredNote(note.id);
        const isStoredNoteEncrypted = encryption.isEncrypted(storedNote);
        if (isStoredNoteEncrypted) {
            const decryptedNote = encryption.decrypt(storedNote);
            if (decryptedNote) {
                notes.fragmentNotes.querySelector('#' + note.id + ' .notes__sections').innerHTML = decryptedNote;
            } else {
                // Decryption failed.
                notes.decryptionFailed = true;
            }
        } else {
            notes.fragmentNotes.querySelector('#' + note.id).classList.add('not-encrypted');
        }
    },
    decryptAllNotes : () => {
        notes.decryptionFailed = false;
        if (useEncryption) {
            notes.notesArray.forEach((note) => {
                if (!notes.decryptionFailed) {
                    notes.decryptNote(note);
                }
            });
            if (notes.decryptionFailed) {
                notes.clearMainNotes();
                dialog.insertPassphrase(true);
            }
        }
    },
    appendNotesToMain : () => {
        if ((useEncryption && !notes.decryptionFailed) || !useEncryption) {
            notes.mainNotes.appendChild(notes.fragmentNotes);
            document.querySelector('.controller').appendChild(notes.templateNavController.content.cloneNode(true));
            document.querySelector('footer').appendChild(notes.templateFooter.content.cloneNode(true));
            checklist.init('Groceries');
        }
    },
    downloadProgress : () => {
        const progressIncrement = 100 / notes.notesArray.length;
        const progress = document.querySelector('#dialogProgressBar progress');
        const small = document.querySelector('#dialogProgressBar small');
        if (progress) {
            progress.value += progressIncrement;
            const percent = Math.round(progress.value).toString() + '%';
            progress.innerHTML = percent;
            small.innerHTML = percent;
        }
        notes.downloadTally += 1;
        notes.downloadComplete = (notes.downloadTally === notes.notesArray.length);
        if (notes.downloadComplete) {
            if ((useEncryption && storage.getPassphrase()) || !useEncryption || isDemo) {
                dialog.removeProgressBar();
                notes.decryptAllNotes();
                notes.appendNotesToMain();
            }
        }
    },
    importStoreInsertAllNotes : () => {
        notes.fragmentNotes = new DocumentFragment();
        notes.downloadTally = 0;
        notes.downloadComplete = false;
        notes.decryptionFailed = false;
        notes.clearMainNotes();
        if (useEncryption && !storage.getPassphrase()) {
            dialog.insertPassphrase();
        } else {
            dialog.insertProgressBar();
        }
        notes.notesArray.forEach((note) => {
            notes.constructDetails(note);
            // Get each note individually and store its contents.
            getNote(notesDirectory + note.dir)
                .then(data => {
                    storage.storeNote(note.id, data.content);
                    notes.insertNote(note);
                    notes.downloadProgress(note);
                })
                .catch(error => {
                    console.error('getNote', {error, 'dir': notesDirectory + note.dir})
                });
        });
    },
    constructNotesObj : (scanDirNotes) => {
        scanDirNotes.forEach((note) => {
            note = note.substring(1);
            const a = note.split('/');
            const id = a[a.length - 1].split('.')[0];
            const dir = (a.length === 1) ? a[0] : note;
            notes.notesArray.push({'id': id, 'dir': dir});
        });
    },
    init : () => {
        getDir().then((response) => {
            const data = JSON.parse(response.content);
            if (Array.isArray(data)) {
                notes.constructNotesObj(data);
                notes.importStoreInsertAllNotes();
            }
        });
    }
}

const checklist = {
    CHECKLIST_ID : '',
    CHECKLIST_LENGTH : '',
    get : (container) => {
        return (container) ? Array.from(container.querySelectorAll('input')) : [];
    },
    init : (id) => {
        checklist.CHECKLIST_ID = id.toLowerCase() + 'Checklist';
        checklist.CHECKLIST_LENGTH = id.toLowerCase() + 'ChecklistLength';
        const checklistContainer = document.getElementById(id);
        const checklistArray = checklist.get(checklistContainer);
        const storedChecklistLength = (storage.getStoredChecklistLength(checklist.CHECKLIST_LENGTH)) ? storage.getStoredChecklistLength(checklist.CHECKLIST_LENGTH) : 0;
        const checklistHasChanged = storage.getHasChanged(storedChecklistLength, checklistArray.length);
        try {
            if (checklistHasChanged) {
                // The number of inputs has changed. Reset storage.
                storage.clearChecklistValues(checklist.CHECKLIST_ID, checklistContainer);
                storage.setChecklistLength(checklist.CHECKLIST_LENGTH, checklistArray.length);
                storage.storeChecklistValues(checklist.CHECKLIST_ID, checklistArray);
            } else if (!storedChecklistLength) {
                // Values were never set.
                storage.setChecklistLength(checklist.CHECKLIST_LENGTH, checklistArray.length);
                storage.storeChecklistValues(checklist.CHECKLIST_ID, checklistArray);
            } else {
                // Update DOM with correct checked values.
                checklistArray.forEach((item, index) => {
                    item.checked = storage.getStoredValue(checklist.CHECKLIST_ID, index);
                });
            }
        } catch (error) {
            console.error('init', {
                error
            });
        }
    },
    viewChecked : (section, checked) => {
        const checklistArray = checklist.get(section);
        try {
            checklistArray.forEach((item, index) => {
                const label = item.closest('label');
                if (checked) {
                    if (index > 0) {
                        if (item.checked) {
                            label.classList.remove('hide');
                        } else {
                            label.classList.add('hide');
                        }
                    }
                } else {
                    if (index > 0) {
                        label.classList.remove('hide');
                    }
                }
            });
        } catch (error) {
            console.error('viewChecked', {error, checklistArray});
        }
    },
    selectAll : (section) => {
        const checklistArray = checklist.get(section);
        try {
            checklistArray.forEach((item, index) => {
                if (index > 0) {
                    item.checked = true;
                }
            });
            section.querySelector('.cl__section input').checked = false;
            checklist.viewChecked(section, false);
            storage.storeChecklistValues(checklist.CHECKLIST_ID, checklistArray);
        } catch (error) {
            console.error('selectAll', {error, checklistArray});
        }
    },
    deselectAll : (section) => {
        const checklistArray = checklist.get(section);
        try {
            checklistArray.forEach((item, index) => {
                if (index > 0) {
                    item.checked = false;
                }
            });
            section.querySelector('.cl__section input').checked = false;
            checklist.viewChecked(section, false);
            storage.storeChecklistValues(checklist.CHECKLIST_ID, checklistArray);
        } catch (error) {
            console.error('deselectAll', {error, checklistArray});
        }
    }
}

notes.init();
main.setupEvents();
navbar.setupEvents();
footer.setupEvents();

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