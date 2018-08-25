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