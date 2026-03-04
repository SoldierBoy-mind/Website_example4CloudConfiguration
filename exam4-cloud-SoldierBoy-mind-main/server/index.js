"use strict"

const Database = require("./database");
const express = require("express"); //web server framework
const morgan = require("morgan"); //logging middleware
const cors = require("cors"); //CORS middleware for secure calls
const { body, validationResult } = require("express-validator");
const { initAuthentication, isLoggedIn } = require("./auth"); // authentication middleware
const passport = require("passport");

const base32 = require('thirty-two'); //totp
const TotpStrategy = require('passport-totp').Strategy; // totp

const port = 3001;
const app = new express();
const db = new Database("CloudService.db");

app.use(express.json());
app.use(morgan('dev'));
app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true
}));

// Initialize authentication(auth.js file)
initAuthentication(app, db);

// Middleware to check if TOTP authentication has been performed
function isTotp(req, res, next) {
  if(req.session.method === 'totp')
    return next();
  return res.status(401).json({ errors: ['Missing TOTP authentication'] });
}

// Setup  TOTP strategy: wehn the user insert the 6 numbers code this strategy recover
//the secret from the user, decode it and verify if its correct
passport.use(new TotpStrategy(
  function (user, done) {
    // In case .secret does not exist, decode() will return an empty buffer
    return done(null, base32.decode(user.secret), 30);  // 30 = period of key validity
  })
);


/**
 * GET /api/configuration
 * Get all configuration parameters (prices, limits, etc.)
 * PUBLIC - no authentication required
 */
app.get("/api/configuration", async (req, res) => {
  try {
    const config = await db.getConfiguration();
    res.json(config);
  } catch (err) {
    res.status(500).json({ errors: ["Failed to fetch configuration"] });
  }
});

/**
 * GET /api/availability
 * Get current resource availability (instances and storage)
 * PUBLIC - no authentication required
 */
app.get("/api/availability", async (req, res) => {
  try {
    const availability = await db.getAvailability();
    res.json(availability);
  } catch (err) {
    res.status(500).json({ errors: ["Failed to fetch availability"] });
  }
});

/**
 * Calculate data transfer price based on tiered pricing
 * @param {number} gb - Data transfer in GB
 * @param {Object} config - Configuration object with pricing parameters
 * @returns {number} - Calculated price
 */
function calculateDataTransferPrice(gb, config) {
  if (gb <= config.transfer_base_gb) {
    return config.price_transfer_base;
  }

  const extraGB = gb - config.transfer_base_gb;
  let price = config.price_transfer_base;

  if (gb <= config.transfer_threshold_1) {
    // Up to 1000 GB: 80% of base price per 10 GB
    price += (extraGB / 10) * config.price_transfer_base * config.transfer_discount_1;
  } else {
    // First part up to 1000 GB
    const firstPartGB = config.transfer_threshold_1 - config.transfer_base_gb;
    price += (firstPartGB / 10) * config.price_transfer_base * config.transfer_discount_1;

    // Remaining part beyond 1000 GB: 50% of base price per 10 GB
    const secondPartGB = gb - config.transfer_threshold_1;
    price += (secondPartGB / 10) * config.price_transfer_base * config.transfer_discount_2;
  }

  return price;
}

/**
 * POST /api/orders
 * Create a new order
 * REQUIRES AUTHENTICATION
 * Prices are calculated server-side for security
 */
app.post(
  "/api/orders",
  isLoggedIn,
  body("ram_gb", "ram_gb must be 16, 32, or 128").isInt().isIn([16, 32, 128]),
  body("storage_tb", "storage_tb must be a positive integer").isInt({ min: 1 }),
  body("data_transfer_gb", "data_transfer_gb must be at least 10").isInt({ min: 10 }),
  async (req, res) => {
    // Check validation errors
    const err = validationResult(req);
    const errList = [];
    if (!err.isEmpty()) {
      errList.push(...err.errors.map(e => e.msg));
      return res.status(400).json({ errors: errList });
    }

    try {
      // Get current availability and configuration
      const availability = await db.getAvailability();
      const config = await db.getConfiguration();

      const { ram_gb, storage_tb, data_transfer_gb } = req.body;

      // Validation: check if there are available instances
      if (availability.instances.available <= 0) {
        return res.status(400).json({ errors: ["No computation instances available"] });
      }

      // Validation: check if there is enough storage
      if (storage_tb > availability.storage.available) {
        return res.status(400).json({ errors: ["Not enough storage available"] });
      }

      // Validation: check minimum storage requirements based on RAM
      if (ram_gb === 32 && storage_tb < config.min_storage_ram_32) {
        return res.status(400).json({
          errors: [`32 GB RAM requires at least ${config.min_storage_ram_32} TB storage`]
        });
      }
      if (ram_gb === 128 && storage_tb < config.min_storage_ram_128) {
        return res.status(400).json({
          errors: [`128 GB RAM requires at least ${config.min_storage_ram_128} TB storage`]
        });
      }

      // Calculate prices server-side (never trust client prices!)
      const ramPrices = { 16: config.price_ram_16, 32: config.price_ram_32, 128: config.price_ram_128 };
      const ramPrice = ramPrices[ram_gb];
      const storagePrice = storage_tb * config.price_storage_tb;
      const transferPrice = calculateDataTransferPrice(data_transfer_gb, config);
      const pricePerMonth = ramPrice + storagePrice + transferPrice;

      // Create the order with server-calculated prices
      const newOrder = await db.createOrder(
        req.user.id,
        ram_gb,
        storage_tb,
        data_transfer_gb,
        ramPrice,
        storagePrice,
        parseFloat(transferPrice.toFixed(2)),
        parseFloat(pricePerMonth.toFixed(2))
      );

      res.status(201).json(newOrder);
    } catch (err) {
      console.error("Error creating order:", err);
      res.status(500).json({ errors: ["Failed to create order"] });
    }
  }
);

/**
 * GET /api/orders
 * Get all orders for the logged-in user
 * REQUIRES AUTHENTICATION
 */
app.get("/api/orders", isLoggedIn, async (req, res) => {
  try {
    const orders = await db.getUserOrders(req.user.id);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ errors: ["Failed to fetch orders"] });
  }
});

/**
 * DELETE /api/orders/:id
 * Delete an order (requires TOTP authentication)
 */
app.delete('/api/orders/:id', isLoggedIn, isTotp, async (req, res) => {
  try {
    await db.deleteOrder(req.params.id, req.user.id);
    res.end();
  } catch {
    res.status(500).json({ errors: ["Database error"] });
  }
});

/**
 * POST /api/sessions
 * Login
 */
app.post(
  "/api/sessions",
  body("username", "username is not a valid email").isEmail(),
  body("password", "password must be a non-empty string").isString().notEmpty(),
  (req, res, next) => {
    // Check if validation is ok
    const err = validationResult(req);
    const errList = [];
    if (!err.isEmpty()) {
      errList.push(...err.errors.map(e => e.msg));
      return res.status(400).json({errors: errList});
    }

    // Perform the actual authentication
    passport.authenticate("local", (err, user) => {
      if (err) {
        res.status(err.status).json({errors: [err.msg]});
      } else {
        req.login(user, err => {
          if (err) return next(err);
          else {
            // Set the login method to 'password' (not TOTP)
            req.session.method = 'password';
            res.json({
              email: user.username,
              name: user.name,
              canDoTotp: user.secret ? true : false,
              isTotp: false
            });
          }
        });
      }
    })(req, res, next);
  }
);

/**
 * DELETE /api/sessions/current
 * Logout
 */
app.delete("/api/sessions/current", isLoggedIn, (req, res) => {
  req.logout(() => res.end());
});

/**
 * GET /api/sessions/current
 * Check if the user is logged in and return their info
 */
app.get("/api/sessions/current", (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      email: req.user.username,
      name: req.user.name,
      canDoTotp: req.user.secret ? true : false,
      isTotp: req.session.method === 'totp'
    });
  } else {
    res.status(401).json({ error: 'Not authenticated' });
  }
});


/**
 * Authenticate and login with totp
 */
app.post('/api/login-totp', isLoggedIn,
  passport.authenticate('totp'),   // passport expect the totp value to be in: body.code
  function(req, res) {
    req.session.method = 'totp';
    res.json({otp: 'authorized'});
  }
);



// activate the server
app.listen(port, (err) => {
  if (err)
    console.log(err);
  else
    console.log(`Server listening at http://localhost:${port}`);
}); 
