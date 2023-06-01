const supportsTouchEvents = (window.DocumentTouch && document instanceof DocumentTouch);

copyToClipboard = ( snippet ) => {
    navigator.clipboard.readText().then(( clipText ) => {
        let template;
        const text = ( clipText ) ? clipText : '';
        const section = `<section class="note__section">
  <h3></h3>
  <p></p>
  <ul>
    <li></li>
    <li></li>
    <li></li>
  </ul>
</section>`;
        const listItem = `<li>${text}</li>`;
        const listItemCode = `<li><button class="code">${text}</button></li>`;
        const listItemBookmark = `<li><a href="${text}" target="_blank" rel="noreferrer">${text}</a></li>`;
        const timeStamp = `<time>` + new Date().toLocaleString('en-US', {
                dateStyle: 'short',
                timeStyle: 'short'
            }) + `</time>`;
        switch ( snippet ) {
            case 'copyToClipboardSection':
                template = section;
                break;
            case 'copyToClipboardListItem':
                template = listItem;
                break;
            case 'copyToClipboardListItemCode':
                template = listItemCode;
                break;
            case 'copyToClipboardListItemBookmark':
                template = listItemBookmark;
                break;
            case 'copyToClipboardTimeStamp':
                template = timeStamp;
                break;
            default:
                template = snippet;
                break;
        }
        navigator.clipboard.writeText(template).then(() => {
            console.log("Copied to clipboard successfully");
        }); // This only works over localhost or https.
    });
}

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
    setScrollSnap: (value) => {
        if (value) {
            try {
                localStorage.setItem('scroll-snap', value);
            } catch (err) {
                console.error('There was a problem saving to storage.', {err, value});
            }
        } else {
            console.error('Value is missing.', {value});
        }
    },
    getScrollSnap: () => {
        return ( localStorage.getItem('scroll-snap') !== null ) ? localStorage.getItem('scroll-snap') : '';
    },
    removeNote: (name) => {
        if (name) {
            try {
                localStorage.removeItem('note-' + name);
            } catch (err) {
                console.error('There was a problem deleting this note.', {err, name});
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

const settings = {
    isScrollSnapTrue: () => {
        return (storage.getScrollSnap() && storage.getScrollSnap() === 'true');
    },
    enableScrollSnap: () => {
        document.getElementsByTagName('html')[0].classList.add('scroll-snap');
        storage.setScrollSnap('true');
    },
    disableScrollSnap: () => {
        document.getElementsByTagName('html')[0].classList.remove('scroll-snap');
        storage.setScrollSnap('false');
    },
    init: () => {
        if ( settings.isScrollSnapTrue() ) {
            settings.enableScrollSnap();
        } else {
            settings.disableScrollSnap();
        }
    }
}

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
            dialog.edit.remove();
        } else if (document.getElementById('dialogSetup')) {
            dialog.setup.remove();
        }
    },
    refreshNotes: () => {
        notes.notesArray = [];
        notes.clearMainNotes();
        notes.init();
    },
    handleDocumentEvents: (e) => {
        const key = e.key;
        const btn = e.target.closest('button');
        if (e.repeat || btn && key) {
            // Enter key fires click and keydown on buttons. This prevents duplicate processing.
            return;
        }
        const removeDialog = () => {
            e.preventDefault();
            e.stopPropagation();
            dialog.removeDialog();
        }
        if (key === "Escape") {
            removeDialog();
        } else if (btn && btn.className === 'close' && !key) {
            removeDialog();
        }
    },
    setupDocumentEvents: () => {
        document.addEventListener('keydown', (e) => {
            dialog.handleDocumentEvents(e);
        });
        document.addEventListener('click', (e) => {
            dialog.handleDocumentEvents(e)
        });
    },
    eventListeners: (obj, callback) => {
        if (supportsTouchEvents) {
            // Avoid double clicks in mobile. This covers tap, pencil, mouse, and keyboard in iOS.
            obj.addEventListener('touchend', (e) => {
                callback(e)
            });
        } else {
            obj.addEventListener('click', (e) => {
                callback(e)
            });
            obj.addEventListener('keydown', (e) => {
                if (e.repeat) { return }
                callback(e)
            });
        }
        obj.addEventListener('submit', (e) => {
            // Prevent default form submission which triggers an unnecessary GET call.
            e.preventDefault();
        });
    },

    progress: {
        insert: () => {
            const templateProgressBar = document.getElementById('templateDialogProgressBar');
            const fragment = templateProgressBar.content.cloneNode(true);
            dialog.toggleBodyDialog(true);
            document.body.prepend(fragment);
            document.getElementById('dialogProgressBar').open = true;
        },
        remove: () => {
            document.getElementById('dialogProgressBar').remove();
            dialog.toggleBodyDialog(false);
        },
    },

    passphrase : {
        setPassphrase: (value) => {
            if (value) {
                storage.setPassphrase(value);
                dialog.passphrase.remove();
                if (notes.downloadComplete) {
                    notes.decryptAllNotes();
                    notes.appendNotesToMain();
                } else {
                    dialog.progress.insert();
                }
            }
        },
        handleEvents: (e) => {
            const target = e.target;
            const btn = target.closest('button');
            const key = e.key;
            const enter = ((key === "Enter") && !e.isComposing);
            const id = (target.id) ? target.id : '';
            if (e.repeat || btn && key) {
                return
            } // Enter key fires click and keydown on buttons. This prevents duplicate processing.
            if (enter || (btn && !key)) {
                const input = document.querySelector('#dialogPassphrase input');
                const error = document.querySelector('#dialogPassphrase .error');
                const action = (v) => {
                    if (v) {
                        error.innerHTML = '';
                        error.classList.remove('show');
                        dialog.passphrase.setPassphrase(v);
                    } else {
                        error.innerHTML = 'Please re-enter your passphrase.';
                        error.classList.add('show');
                        input.focus();
                    }
                }
                switch (id) {
                    case 'submitPassphrase':
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        e.stopPropagation();
                        action(input.value);
                        break;
                    case 'passphrase':
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        e.stopPropagation();
                        if (enter) {
                            action(input.value);
                        }
                        break;
                    default:
                        break;
                }
            }
        },
        addEventListeners: (obj) => {
            dialog.eventListeners(obj, dialog.passphrase.handleEvents);
        },
        insert: (err) => {
            if (!document.getElementById('dialogPassphrase')) {
                notes.clearMainNotes();
                const templateDialogPassphrase = document.getElementById('templateDialogPassphrase');
                const fragment = templateDialogPassphrase.content.cloneNode(true);
                const d = fragment.querySelector('dialog');
                dialog.passphrase.addEventListeners(d);
                dialog.toggleBodyDialog(true);
                document.body.prepend(fragment);
                document.querySelector('#dialogPassphrase input').focus();
                if (err) {
                    const error = document.querySelector('#dialogPassphrase .error');
                    error.innerHTML = 'Please renter your passphrase.';
                    error.classList.add('show');
                }
            }
        },
        remove: () => {
            document.getElementById('dialogPassphrase').remove();
            dialog.toggleBodyDialog(false);
        }
    },


    edit : {

        handleEvents: (e) => {
            const target = e.target;
            const btn = target.closest('button');
            const key = e.key;
            const enter = ((key === "Enter") && !e.isComposing);
            let id;
            let refreshId;
            let form;
            let data;
            if ( btn && btn.id ) {
                id = btn.id; }
            if ((btn && !key) || (key && enter)) {
                switch (id) {
                    case 'saveNote':
                        e.preventDefault();
                        e.stopPropagation();
                        // Get ID of section to repopulate
                        refreshId = target.closest('dialog').getAttribute('data');
                        const dialogEdit = document.getElementById('dialogEdit');
                        // Show Spinner
                        // document.querySelector('dialog').classList.add('processing');
                        dialogEdit.classList.add('processing');
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
                                    dialog.edit.remove(refreshId);
                                } else if (code > 200) {
                                    console.error(response);
                                }
                            } catch (e) {
                                console.error(e);
                            }
                        })();
                        break;
                    case 'copyToClipboardSection':
                        e.preventDefault();
                        e.stopPropagation();
                        copyToClipboard('copyToClipboardSection');
                        break;
                    case 'copyToClipboardListItem':
                        e.preventDefault();
                        e.stopPropagation();
                        copyToClipboard('copyToClipboardListItem');
                        break;
                    case 'copyToClipboardListItemCode':
                        e.preventDefault();
                        e.stopPropagation();
                        copyToClipboard('copyToClipboardListItemCode');
                        break;
                    case 'copyToClipboardListItemBookmark':
                        e.preventDefault();
                        e.stopPropagation();
                        copyToClipboard('copyToClipboardListItemBookmark');
                        break;
                    case 'copyToClipboardTimeStamp':
                        e.preventDefault();
                        e.stopPropagation();
                        copyToClipboard('copyToClipboardTimeStamp');
                        break;
                    case 'clearTheClipboard':
                        e.preventDefault();
                        e.stopPropagation();
                        copyToClipboard('');
                        break;
                    default:
                        break;
                }
            }
        },
        addEventListeners: (obj) => {
            dialog.eventListeners(obj, dialog.edit.handleEvents);
        },
        insert: (content, dir, id, title, lastModified) => {
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
                dialog.edit.addEventListeners(d);
                dialog.toggleBodyDialog(true, 'edit');
                document.body.prepend(fragment);
                window.scrollTo(0, 0);
                const eventFocus = new Event('focus');
                d.querySelector('#dialogEdit textarea').focus();
                d.querySelector('#dialogEdit textarea').dispatchEvent(eventFocus);
            }
        },
        remove: (id) => {
            document.getElementById('dialogEdit').remove();
            main.removeSelectedClass();
            dialog.toggleBodyDialog(false, 'edit', id);
        },
    },

    setup: {
        handleEvents: (e) => {
            const target = e.target;
            const btn = target.closest('button');
            const label = target.closest('label');
            const key = e.key;
            const enter = ((key === "Enter") && !e.isComposing);
            let id;
            if (target.id) {
                id = target.id;
            } else if (btn && btn.id) {
                id = btn.id;
            } else if (label && label.id) {
                id = label.id;
            }
            if (e.repeat || btn && key) {
                return
            } // Enter key fires click and keydown on buttons. This prevents duplicate processing.
            if (!key || enter || (btn && !key)) {
                switch (id) {
                    case 'createNote':
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        e.stopPropagation();
                        dialog.create.handleEvents();
                        break;
                    case 'createNoteInput':
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        e.stopPropagation();
                        if (enter) {
                            dialog.create.handleEvents();
                        }
                        break;
                    case 'deleteNote':
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        e.stopPropagation();
                        dialog.delete.handleEvents();
                        break;
                    case 'deleteNoteInput':
                        e.preventDefault();
                        e.stopImmediatePropagation();
                        e.stopPropagation();
                        if (enter) {
                            dialog.delete.handleEvents();
                        }
                        break;
                    case 'scrollSnapLabel':
                        settings.enableScrollSnap();
                        break;
                    case 'scrollDefaultLabel':
                        settings.disableScrollSnap();
                        break;
                    default:
                        break;
                }
            }
        },
        addEventListeners: (obj) => {
            dialog.eventListeners(obj, dialog.setup.handleEvents);
        },
        insert: () => {
            if (!document.getElementById('dialogSetup')) {
                const templateDialogSetup = document.getElementById('templateDialogSetup');
                let fragment = templateDialogSetup.content.cloneNode(true);
                let d = fragment.querySelector('dialog');
                dialog.setup.addEventListeners(d);
                dialog.toggleBodyDialog(true, 'setup');
                document.body.prepend(fragment);
                window.scrollTo(0, 0);
                d.querySelector('input').focus();
                if ( settings.isScrollSnapTrue() ) {
                    document.getElementById('scrollSnap').checked = 'checked';
                } else {
                    document.getElementById('scrollDefault').checked = 'checked';
                }
            }
        },
        remove: () => {
            document.getElementById('dialogSetup').remove();
            dialog.toggleBodyDialog(false, 'setup');
        },
    },

    create : {
        handleEvents: () => {
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
                            dialog.setup.remove();
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
        }
    },

    delete : {
        handleEvents: () => {
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
                            dialog.setup.remove();
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
        }
    },

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
            enter = ((key === "Enter") && !e.isComposing),
            btn = target.closest('button'),
            code = (target.closest('code') || e.tagName === 'code' || target.classList.contains('code')),
            label = target.closest('label');
        if (!key || enter) {
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
                        dialog.edit.insert(data.content, dir, id, title, data.lastModified);
                        main.removeSelectedClass();
                    })
                    .catch(error => {
                        console.error('getNote', {error});
                        // Get from local storage instead.
                        const note = notes.notesArray.filter((note) => {
                            return note.id === id
                        });
                        const content = storage.getStoredNote(id);
                        dialog.edit.insert(content, note[0].dir, note[0].id, title, '');
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
};

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
};

const footer = {
    el : document.querySelector('footer'),
    handleEvents : (e) => {
        const
            target = e.target,
            btn = target.closest('button');
        if (btn) {
            e.preventDefault();
            dialog.setup.insert();
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
};

async function getDir() {
    return (await fetch('get-dir')).json();
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
};

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
            if (note && note.id && notes.fragmentNotes.querySelector('[id="' +  note.id + '"] .notes__sections')) {
                notes.fragmentNotes.querySelector('[id="' +  note.id + '"] .notes__sections').innerHTML = storage.getStoredNote(note.id);
            } else {
                console.error('insertNote', {
                    note,
                    'note.id': note.id,
                    '.notes__sections': notes.fragmentNotes.querySelector('[id="' +  note.id + '"] .notes__sections')
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
                notes.fragmentNotes.querySelector('[id="' +  note.id + '"] .notes__sections').innerHTML = decryptedNote;
            } else {
                // Decryption failed.
                notes.decryptionFailed = true;
            }
        } else {
            notes.fragmentNotes.querySelector('[id="' +  note.id + '"]').classList.add('not-encrypted');
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
                dialog.passphrase.insert(true);
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
                dialog.progress.remove();
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
            dialog.passphrase.insert();
        } else {
            dialog.progress.insert();
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
        (async () => {
            let response = {};
            try {
                response = await getDir();
                const code = parseInt(response.code);
                const data = JSON.parse(response.data);
                if (code === 200) {
                    if (Array.isArray(data)) {
                        notes.constructNotesObj(data);
                        notes.importStoreInsertAllNotes();
                    }
                } else if (code > 200) {
                    dialog.setup.insert();
                    console.error(response);
                }
            } catch (e) {
                dialog.setup.insert();
                console.error(e);
            }
        })();
    }
};

const checklist = {
    CHECKLIST_KEY : '',
    CHECKLIST_LENGTH : '',
    get : (container) => {
        return (container) ? Array.from(container.querySelectorAll('input')) : [];
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
            storage.storeChecklistValues(checklist.CHECKLIST_KEY, checklistArray);
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
            storage.storeChecklistValues(checklist.CHECKLIST_KEY, checklistArray);
        } catch (error) {
            console.error('deselectAll', {error, checklistArray});
        }
    },
    init : (id) => {
        checklist.CHECKLIST_KEY = id.toLowerCase() + 'Checklist';
        checklist.CHECKLIST_LENGTH = id.toLowerCase() + 'ChecklistLength';
        const checklistContainer = document.getElementById(id);
        const checklistArray = checklist.get(checklistContainer);
        const storedChecklistLength = (storage.getStoredChecklistLength(checklist.CHECKLIST_LENGTH)) ? storage.getStoredChecklistLength(checklist.CHECKLIST_LENGTH) : 0;
        const checklistHasChanged = storage.getHasChanged(storedChecklistLength, checklistArray.length);
        try {
            if (checklistHasChanged) {
                // The number of inputs has changed. Reset storage.
                storage.clearChecklistValues(checklist.CHECKLIST_KEY, checklistContainer);
                storage.setChecklistLength(checklist.CHECKLIST_LENGTH, checklistArray.length);
                storage.storeChecklistValues(checklist.CHECKLIST_KEY, checklistArray);
            } else if (!storedChecklistLength) {
                // Values were never set.
                storage.setChecklistLength(checklist.CHECKLIST_LENGTH, checklistArray.length);
                storage.storeChecklistValues(checklist.CHECKLIST_KEY, checklistArray);
            } else {
                // Update DOM with correct checked values.
                checklistArray.forEach((item, index) => {
                    item.checked = storage.getStoredValue(checklist.CHECKLIST_KEY, index);
                });
            }
        } catch (error) {
            console.error('init', {
                error
            });
        }
    }
};

notes.init();
main.setupEvents();
navbar.setupEvents();
footer.setupEvents();
dialog.setupDocumentEvents();
settings.init();

// if ('serviceWorker' in navigator) {
//     // Wait for the 'load' event to not block other work
//     window.addEventListener('load', async () => {
//         // Try to register the service worker.
//         try {
//             const reg = await navigator.serviceWorker.register('/service-worker.js');
//             // console.log('Service worker registered! 😎', reg);
//         } catch (err) {
//             // console.log('😥 Service worker registration failed: ', err);
//         }
//     });
// }