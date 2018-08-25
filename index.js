// Create needed constants
const list = document.querySelector('ul');
const titleInput = document.querySelector('#title');
const bodyInput = document.querySelector('#body');
const form = document.querySelector('form');
const submitBtn = document.querySelector('form button');

// create an instance of a db object for us to store the open
// database in
let db;

window.onload = function() {
    // open our database; it is created if it doesn't already exist
    // (see onupgradeneeded below)
    let request = window.indexedDB.open('notes', 1);

    // onerror handler signifies that the database didn't open successfully
    request.onerror = function() {
        console.log('Database failed to open');
    };

    // onsuccess handler signifies that the databaase opened successfully
    request.onsuccess = function() {
        console.log('Database opened successfully');

        // store the opened databaase object in the db variable. 
        // this is used a lot below
        db = request.result;

        // run the displayData() function to display the notes already
        // in the IDB
        displayData();

    };

    // Setup the database tables if this has not already been done
    request.onupgradeneeded = function(e) {
        // Grab a reference to the opened database
        let db = e.target.result;

        // Create an objectStore to store our notes in (basically like
        // a single table, including an auto-incrementing key
        let objectStore = db.createObjectStore('notes', { keyPath: 'id', autoincrement: true });

        // Define what data items in the database will contain
        objectStore.createIndex('title', 'title', { unique: false });
        objectStore.createIndex('body', 'body', { unique: false });

        console.log('Database setup complete');
    };

    // Create an onsubmit handler so that when the form is submitted, 
    // the addData() function is run
    form.onsubmit = addData();

    // Define the addData() function
    function addData(e) {
        // prevent default - we don't want the form to submit in the conventional way
        // which would trigger a page refresh, ruining the experience
        e.preventDefault();

        // grab the values entered into the form fields and store them in an object
        // ready for being inserted into the DB
        let newItem = { title: titleInput.nodeValue, body: bodyInput.value };

        // open a read/write db transaction, ready for adding the data
        let transaction = db.transaction(['notes'], 'readwrite');

        // call an object store that's already been added to the database
        let objectStore = transaction.objectStore('notes');

        // Make a requst to add our newItem object to the object store
        var request = objectStore.add(newItem);
        request.onsuccess = function() {
            // clear the form, ready for adding the next entry
            titleInput.value = '';
            bodyInput.value = '';
        };

        // Report on the success of the transaction completing, when everything is done
        transaction.oncomplete = function() {
            console.log('Transaction completed: database modification finished.');

            // update the display of data to show the newly added item, by running displayData() again
            displayData();
        };

        transaction.onerror = function() {
            console.log('Transaction not opened due to error.');
        };
    }
};

// define the displayData() function
function displayData() {
    // Here we empty the contents of the list element each time the display is updated
    // Without this, we'd get duplicates listed each time a note is added
    while (list.firstChild) {
        list.removeChild(list.firstChild);
    }

    // open object store and then get a cursor - which iterates through
    // all the different data items in the store
    let objectStore = db.transaction('notes').objectStore('notes');
    objectStore.openCursor().onsuccess = function(e) {
        // Get a reference to the cursor
        let cursor = e.target.result;

        // if there is still another data item to iterate through, keep this code
        if (cursor) {
            // create a list item, h3, and p to put each data item inside when displaying it
            // structure the HTML fragment, and append it inside the list
            let listItem = document.createElement('li');
            let h3 = document.createElement('h3');
            let para = document.createElement('p');

            listItem.appendChild(h3);
            listItem.appendChild(para);
            listItem.appendChild(listItem);

            // pu the data from the cursor inside the h3 and para
            h3.textContent = cursor.value.title;
            para.textContent = cursor.value.body;

            // store the ID of the data item inside an attribute on the listItem so we know
            // which item it corresponds to. This will be useful later when we want to delete items
            listItem.setAttribute('data-note-id', cursor.value.id);

            // Create a button and place it inside each listItem
            let deleteBtn = document.createElement('button');
            listItem.appendChild(deleteBtn);
            deleteBtn.textContent = 'Delete';

            // set an event handler so that when the button is clicked, the deleteitem()
            // function is run
            deleteBtn.onclick = deleteItem;

            // Iterate to the next item in the cursor
            cursor.continue();
        } else {
            // Again, if list item is empty, display a 'No notes stored' messaage
            if (!list.firstChild) {
                let listItem = document.createElement('li');
                listItem.textContent = 'No notes stored.';
                list.appendChild(listItem);
            }
            // if there are no more cursor items to iterate though, say so
            console.log('Notes all displayed');
        }

    };

}

// define deleteItem() function
function deleteItem(e) {
    // retrieve the name of the task we want to delete. We need to convert
    // it to a number before trying to use it with IDB; IDB key values are
    // type-sensitive.
    let noteId = Number(e.target.parentNode.getAttribute('data-note-id'));

    // open a database transaction and delete the task, finding it using 
    // the id we retrieved above
    let transaction = db.transaction(['notes'], 'readwrite');
    let objectStore = transaction.objectStore('notes');
    let request = objectStore.delete(noteId);

    // report that the data item has been deleted
    transaction.oncomplete = function() {
        // delete the parent of the button
        // which is the list item, so it is no longer displayed
        e.target.parentNode.parentNode.removeChild(e.target.parentNode);
        console.log('Note ' + noteId + ' deleted.');

        // Again, if the list item is empty, dispaly a 'No notes stored' message
        if (!list.firstChild) {
            let listItem = document.createElement('li');
            listItem.textContent = 'No notes stored.';
            list.appendChild(listItem);
        }
    };
}