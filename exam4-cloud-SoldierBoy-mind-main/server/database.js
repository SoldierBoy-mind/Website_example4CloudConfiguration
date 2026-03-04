"use strict"

const sqlite = require("sqlite3");
const crypto = require("crypto");

/**
 * Wrapper around db.all
 */
const dbAllAsync = (db, sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else     resolve(rows);
  });
});

/**
 * Wrapper around db.run
 */
const dbRunAsync = (db, sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, err => {
    if (err) reject(err);
    else     resolve();
  });
});

/**
 * Wrapper around db.get
 */
const dbGetAsync = (db, sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else     resolve(row);
  });
});

/**
 * Interface to the sqlite database for the application
 *
 * @param dbname name of the sqlite3 database file to open
 */

function Database(dbname) {
  this.db = new sqlite.Database(dbname, err => {
    if (err) throw err;
  });
  
this.authUser = (email, password) => new Promise((resolve, reject) => {
    // Get the user with the given email
    dbGetAsync(
      this.db,
      "select * from users where email = ?",
      [email]
    )
      .then(user => {
        // If there is no such user, resolve to false.
        // This is used instead of rejecting the Promise to differentiate the
        // failure from database errors
        if (!user) resolve(false);

        // Verify the password hashed with the stored salt
        crypto.scrypt(password, user.salt, 32, (err, hash) => {
          if (err) reject(err);

          if (crypto.timingSafeEqual(hash, Buffer.from(user.hash, "hex")))
            resolve({id: user.id, username: user.email, name: user.name, secret: user.secret});
          else resolve(false);
        });
      })
      .catch(e => reject(e));
  });

  /**
   * Retrieve the user with the specified id
   *
   * @param id the id of the user to retrieve
   *
   * @returns a Promise that resolves to the user object {id, username, name, secret}
   */
  this.getUser = async id => {
    const user = await dbGetAsync(
      this.db,
      "select email as username, name, secret from users where id = ?",
      [id]
    );

    if (!user) throw { error: "User not found" };

    return {...user, id};
  };

  /**
   * Get all configuration parameters
   * @returns a Promise that resolves to an object with all config key-value pairs
   */
  this.getConfiguration = async () => {
    const rows = await dbAllAsync(this.db, "SELECT key, value FROM configuration");

    // Convert array of {key, value} to object {key: value}
    const config = {};
    rows.forEach(row => {
      config[row.key] = row.value;
    });

    return config;
  };

  /**
   * Get resource availability (instances and storage)
   * @returns a Promise with {instances: {total, used, available}, storage: {total, used, available}}
   */
  this.getAvailability = async () => {
    // Get configuration limits
    const config = await this.getConfiguration();

    // Count total instances used
    const instancesResult = await dbGetAsync(
      this.db,
      "SELECT COUNT(*) as count FROM orders"
    );

    // Sum total storage used
    const storageResult = await dbGetAsync(
      this.db,
      "SELECT SUM(storage_tb) as total FROM orders"
    );

    const instancesUsed = instancesResult.count || 0;
    const storageUsed = storageResult.total || 0;

    return {
      instances: {
        total: config.max_instances,
        used: instancesUsed,
        available: config.max_instances - instancesUsed
      },
      storage: {
        total: config.max_storage_tb,
        used: storageUsed,
        available: config.max_storage_tb - storageUsed
      }
    };
  };

  /**
   * Get all orders for a specific user
   * @param userId the id of the user
   * @returns a Promise that resolves to an array of orders
   */
  this.getUserOrders = async (userId) => {
    return await dbAllAsync(
      this.db,
      "SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC",
      [userId]
    );
  };

  /**
   * Create a new order
   * @param userId the id of the user placing the order
   * @param ramGb RAM in GB (16, 32, or 128)
   * @param storageTb storage in TB
   * @param dataTransferGb data transfer in GB
   * @param ramPrice price for RAM per month
   * @param storagePrice price for storage per month
   * @param transferPrice price for data transfer per month
   * @param pricePerMonth total price per month in euros
   * @returns a Promise that resolves to the newly created order object
   */
  this.createOrder = async (userId, ramGb, storageTb, dataTransferGb, ramPrice, storagePrice, transferPrice, pricePerMonth) => {
    // Insert the new order
    await dbRunAsync(
      this.db,
      `INSERT INTO orders (user_id, ram_gb, storage_tb, data_transfer_gb, ram_price, storage_price, transfer_price, price_per_month)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, ramGb, storageTb, dataTransferGb, ramPrice, storagePrice, transferPrice, pricePerMonth]
    );

    // Get the newly created order (last inserted row)
    const newOrder = await dbGetAsync(
      this.db,
      "SELECT * FROM orders WHERE id = last_insert_rowid()"
    );

    return newOrder;
  };

  /**
   * Delete an existing order
   * @param id the id of the order to delete
   * @param userId the id of the user who owns the order
   * @returns a Promise that resolves to the number of affected rows
   */
  this.deleteOrder = (id, userId) => {
    return new Promise((resolve, reject) => {
      const sql = 'DELETE FROM orders WHERE id = ? AND user_id = ?';  // Double-check that the order belongs to the userId
      // It is MANDATORY to check that the order belongs to the userId
      this.db.run(sql, [id, userId], function (err) {
        if (err) {
          reject(err);
          return;
        } else
          resolve(this.changes);  // return the number of affected rows
      });
    });
  };
}

module.exports = Database;