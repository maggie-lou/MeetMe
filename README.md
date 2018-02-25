# meetme
To start application on localhost: `npm start`

# Database Population 
For development purposes, any previous databases are deleted when `server.js` is run, i.e. when `npm start` is called. This is to ensure consistent test data across all testing environments, by deleting any local changes to the database during the last session. 

To repopulate the database with consistent test data, navigate to the home page at localhost:3000 and initialize the database. 

Because the group ID is currently hardcoded in control.js, must manually change. After populating the database, go to localhost:3000/groups to see the current groups in the database. Grab one of the group IDs and copy and paste into the get request under the comment "Get group calendar events from database".
