/* Copyright (c) 2015, 2023, Oracle and/or its affiliates. */

/******************************************************************************
 *
 * This software is dual-licensed to you under the Universal Permissive License
 * (UPL) 1.0 as shown at https://oss.oracle.com/licenses/upl and Apache License
 * 2.0 as shown at https://www.apache.org/licenses/LICENSE-2.0. You may choose
 * either license.
 *
 * If you elect to accept the software under the Apache License, Version 2.0,
 * the following applies:
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * NAME
 *   36. dataTypeTimestamp4.js
 *
 * DESCRIPTION
 *    Testing Oracle data type support - TIMESTAMP (4) WITH TIME ZONE.
 *
 * NOTE
 *   TIMESTAMP support is still under enhancement request. This test is suspended.
 *
 *****************************************************************************/
'use strict';

const oracledb = require('oracledb');
const assert   = require('assert');
const dbConfig = require('./dbconfig.js');
const assist   = require('./dataTypeAssist.js');

describe('36. dataTypeTimestamp4.js', function() {

  let connection = null;
  let tableName = "nodb_timestamp4";
  before('get one connection', async function() {
    connection = await oracledb.getConnection(dbConfig);
  });

  after('release connection', async function() {
    await connection.close();
  });

  describe('36.1 Testing JavaScript Date with database TIMESTAMP (4) WITH TIME ZONE', function() {
    let dates = assist.data.dates;

    before('create table, insert data', async function() {
      await new Promise((resolve) => {
        assist.setUp(connection, tableName, dates, resolve);
      });
    });

    after(async function() {
      oracledb.fetchAsString = [];
      await connection.execute(`DROP table ` + tableName + ` PURGE`);
    });

    it('36.1.1 works well with SELECT query', async function() {
      await new Promise((resolve) => {
        assist.dataTypeSupport(connection, tableName, dates, resolve);
      });
    });

    it('36.1.2 works well with result set', async function() {
      await new Promise((resolve) => {
        assist.verifyResultSet(connection, tableName, dates, resolve);
      });
    });

    it('36.1.3 works well with REF Cursor', async function() {
      await new Promise((resolve) => {
        assist.verifyRefCursor(connection, tableName, dates, resolve);
      });
    });

    it('36.1.4 columns fetched from REF CURSORS can be mapped by fetchInfo settings', async function() {
      await new Promise((resolve) => {
        assist.verifyRefCursorWithFetchInfo(connection, tableName, dates, resolve);
      });
    });

    it('36.1.5 columns fetched from REF CURSORS can be mapped by oracledb.fetchAsString', async function() {
      oracledb.fetchAsString = [ oracledb.DATE ];
      await new Promise((resolve) => {
        assist.verifyRefCursorWithFetchAsString(connection, tableName, dates, resolve);
      });
    });

  }); // end of 36.1 suite

  describe('36.2 stores null value correctly', function() {
    it('36.2.1 testing Null, Empty string and Undefined', async function() {
      await new Promise((resolve) => {
        assist.verifyNullValues(connection, tableName, resolve);
      });
    });
  });

  describe('36.3 testing TIMESTAMP (4) WITH TIME ZONE', function() {
    let timestamps = assist.TIMESTAMP_TZ_STRINGS_1;

    before(async function() {
      await new Promise((resolve) => {
        assist.setUp4sql(connection, tableName, timestamps, resolve);
      });
    });

    after(async function() {
      await connection.execute(`DROP table ` + tableName + ` PURGE`);
    }); // after

    it('36.3.1 SELECT query - original data', async function() {
      await new Promise((resolve) => {
        assist.selectOriginalData(connection, tableName, timestamps, resolve);
      });
    });

    it('36.3.2 SELECT query - formatted data for comparison', async function() {
      await Promise.all(timestamps.map(async function(timestamp) {
        let bv = timestamps.indexOf(timestamp);
        let result = await connection.execute(
          `SELECT num, TO_CHAR(content, 'DD-MM-YYYY HH24:MI:SS.FF TZH:TZM') AS TS_DATA FROM ` + tableName + ` WHERE num = :no`,
          { no: bv },
          { outFormat: oracledb.OUT_FORMAT_OBJECT });
        assert.strictEqual(result.rows[0].TS_DATA, assist.content.timestamps4[bv]);
      }));
    });

    it('36.3.3 returns scalar types from PL/SQL block', async function() {
      let sql = "BEGIN SELECT systimestamp into :bv from dual; END;";
      let binds = { bv: { dir: oracledb.BIND_OUT, type: oracledb.STRING } };
      let options = { outFormat: oracledb.OUT_FORMAT_OBJECT };

      let result = await connection.execute(
        sql,
        binds,
        options);
      assert.strictEqual(typeof result.outBinds.bv, "string");
    });
  });
});
