import client from '../lib/pg-admin-client.js';
import pgInstClient from '../lib/pg-instance-client.js';
import pgFormat from 'pg-format';
import logger from '../lib/logger.js';
import config from '../lib/config.js';

class Database {

  /**
   * @method getConnection
   * @description Returns a postgres user connection object for a postgres instance
   * 
   * @param {String} dbNameOrId PG Farm instance name or ID 
   * @param {String} orgNameOrId PG Farm organization name or ID 
   * @param {Object} opts
   * @param {String} opts.username optional.  Defaults to 'postgres'
   * @param {Boolean} opts.useSocket optional.  If true, returns a connection object for a unix socket
   * 
   * @returns {Promise<Object>}
   */
  async getConnection(dbNameOrId, orgNameOrId=null, opts={}) {

    if( !opts.username ) {
      opts.username = 'postgres';
    }

    let db;
    if( dbNameOrId === 'postgres' ) {
      db = {name: 'postgres'};
      opts.useSocket = true;
    } else {
      db = await this.get(dbNameOrId, orgNameOrId);
    }

    if( opts.useSocket ) {
      return {
        host : '/var/run/postgresql',
        user : opts.username,
        database : db.name || db.database_name
      }
    }

    let user;
    try {
      user = await this.models.user.get(dbNameOrId, orgNameOrId, opts.username);
    } catch(e) { 
      if( username === 'postgres' ) {
        let instance = await this.models.instance.get(db.instance_id);
        return {
          host : instance.hostname,
          port : instance.port,
          user : username,
          database : db.name || db.database_name,
          password : config.pgInstance.adminInitPassword
        }
      }
      throw e;
    }

    return {
      host : user.instance_hostname,
      port : user.instance_port,
      user : user.username,
      database : user.database_name,
      password : user.password
    };
  }

  async get(nameOrId, orgNameOrId) {
    let organizationId = null;
    if( orgNameOrId ) {
      let org = await client.getOrganization(orgNameOrId);
      organizationId = org.organization_id;
    }

    return client.getDatabase(nameOrId, organizationId);
  }

  async exists(name, orgNameOrId) {
    try {
      let db = await this.get(name, orgNameOrId);
      return db;
    } catch(e) {}

    return false;
  }

  /**
   * @method create
   * @description Create a new database
   * 
   * @param {*} name 
   * @param {*} opts 
   */
  async create(title, opts) {
    if( !opts.name ) {
      opts.name = title.toLowerCase().trim().replace(/[^a-z0-9]/g, '-');
    }

    // make sure the name is prefixed with inst- (instance) prefix
    // this is to avoid conflicts with accessing the postgres instance
    // by name 
    opts.name = opts.name.replace(/^inst-/, '');

    let orgName = '';
    if( opts.organization ) {
      orgName = await this.models.organization.get(opts.organization);
      orgName = orgName.name+'-';
    }
    opts.pgrest_hostname = `rest-${orgName}${opts.name}`;

    logger.info('Creating database', title, opts);

    try {
      await client.createDatabase(title, opts);
    } catch(e) {
      logger.warn('Failed to create database in admin db', title, e.message);
    }

    let db = await this.get(opts.name, opts.organization);

    await this.ensurePgDatabase(db.instance_id, db.organization_id, db.database_name);
  }

  async ensurePgDatabase(instNameOrId, orgNameOrId, dbName) {
    let con = await this.models.instance.getConnection(instNameOrId, orgNameOrId);
    try {
      logger.info('Ensuring database '+dbName+' on instance', orgNameOrId, instNameOrId);
      await pgInstClient.ensurePgDatabase(con, dbName);
    } catch(e) {
      logger.warn(`Failed to create database ${dbName} on host ${con.host}`, e.message);
    }
  }


}

const database = new Database();
export default database;