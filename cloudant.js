module.exports = { reconfigure: reconfigure
                 , fix_request     : fix_request
                 , db_functions    : db_functions
                 , server_functions: server_functions
                 };

//
// Cloudant functionality
//

var _ = require('underscore');
var URL = require('url');


// Rebuild a standard Nano configuration object into one for use with Cloudant.
function reconfigure(config) {
  config = _.clone(config || {});

  // An account can be just the username, or the full cloudant URL.
  var match = config.account && config.account.match && config.account.match(/(\w+)\.cloudant\.com/);
  if (match)
    config.account = match[1];

  // Configure for Cloudant, either authenticated or anonymous.
  if (config.account && config.password)
    config.url = 'https://' + config.account + ':' + config.password + '@' + config.account + '.cloudant.com';
  else if (config.account)
    config.url = 'https://' + config.account + '.cloudant.com';

  return config;
}


// Add the Cloudant API for server functions.
function server_functions(nano) {
  nano.generate_api_key = generate_api_key;
  nano.set_permissions  = set_permissions;
  return nano;
}


// Modify a request just before it is about to go out. A valuable part of Nano
// is its relax() function, chock full of fixes and workarounds to maneuver all
// the idiosynchrasies of CouchDB and Cloudant. It is worth using. However, it
// is not very extensible. In particular, it only allows querying paths inside
// the main CouchDB URL. This is bad, because some Cloudant features are in a
// completely different domain. Additionally, we do not want the maintenance
// headache of modifying that function and then managing merge conflicts from
// upstream changes. The solution is a one-line change to relax(), to call this
// function immediately before the request runs. A faux method, CLOUDANT,
// triggers special handling here, to do the right thing.
function fix_request(req, config) {
  if (req.method != 'CLOUDANT')
    return;

  var url = URL.parse(req.uri);
  if (url.pathname == '/generate_api_key') {
    req.method = 'POST';
    req.uri = 'https://' + config.account + ':' + config.password + '@cloudant.com/api/generate_api_key';
  }

  else if (url.pathname == '/set_permissions') {
    req.method = 'POST';
    req.uri = 'https://' + config.account + ':' + config.password + '@cloudant.com/api/set_permissions';
  }

  else
    throw new Error('Bad Cloudant request: ' + JSON.stringify(req));
}


function generate_api_key(callback) {
  var nano = this;

  if (!nano.config.account)
    throw new Error('generate_api_key requires an "account" parameter during Cloudant initialization');
  if (!nano.config.password)
    throw new Error('generate_api_key requires an "password" parameter during Cloudant initialization');

  nano.relax({method:'CLOUDANT', path:'generate_api_key'}, callback);
}


function set_permissions(opts, callback) {
  var nano = this;

  if (!nano.config.account)
    throw new Error('set_permissions requires an "account" parameter during initialization');
  if (!nano.config.password)
    throw new Error('set_permissions requires an "password" parameter during initialization');

  // Add the username prefix that Cloudant wants.
  var db = opts.database || '';
  opts.database = nano.config.account + '/' + db;

  nano.relax({method:'CLOUDANT', path:'set_permissions', form:opts}, callback);
}


// Add the Cloudant API for database functions.
function db_functions(db, relax) {
  db._cloudant_relax = relax;
  db.index = db_index;
  db.find = index_find;

  return db;
}

function db_index(definition, callback) {
  var db = this;
  if (!callback && typeof definition == 'function')
    return index_list(db, definition); // "definition" is in fact the callback.
  else
    return index_create(db, definition, callback);
}

function index_list(db, callback) {
  return db._cloudant_relax({db:db.config.db, path:'_index'}, callback);
}

function index_create(db, definition, callback) {
  return db._cloudant_relax({method:'POST', db:db.config.db, path:'_index', body:definition}, callback);
}

function index_find(query, callback) {
  var db = this;
  return db._cloudant_relax({method:'POST', db:db.config.db, path:'_find', body:query}, callback);
}