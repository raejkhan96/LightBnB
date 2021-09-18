const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');
const { rows } = require('pg/lib/defaults');

const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});


/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool
    .query( `SELECT users.email, users.id, users.password FROM users WHERE users.email = $1`,[email])
    .then((result) => {
      // lmeyer@hotmail.com
      // password
      if(result.rows.length === 0) {
        return null;
      }
      return (result.rows[0]);
    })
    .catch((err) => {
      return (err.message);
    });
}
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
    .query( `SELECT users.name, users.email, users.id FROM users WHERE users.id = $1`,[id])
    .then((result) => {
      if(result.rows.length === 0) {
        return null;
      }
      return (result.rows);
    })
    .catch((err) => {
      return (err.message);
    });
}
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  console.log('USER:', user);
  return pool
    .query( `INSERT INTO users(name, email, password) VALUES ($1, $2, $3) RETURNING *`,[user.name, user.email, user.password])
    .then((result) => {
      console.log('RESULT ROWS', result.rows);
      return (result.rows);
    })
    .catch((err) => {
      return (err.message);
    });
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  queryString = 
  `SELECT * 
  FROM reservations 
  JOIN properties
  ON reservations.property_id = properties.id
  WHERE guest_id = $1
  LIMIT $2`
  return pool
    .query(queryString,[guest_id, limit])
    .then((result) => {
      console.log('RESULT ROWS', result.rows);
      return (result.rows);
    })
    .catch((err) => {
      console.log('ERROR', err.message);
      return (err.message);
    });
}
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  
  const queryParams = [];

  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) AS average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_reviews.property_id
  WHERE 1 = 1
  `;
  console.log('CITY', options.city);
  if (options.city) {
    queryParams.push(`%${options.city}`);
    queryString += `AND properties.city LIKE $${queryParams.length}`;
  }

  // Owner Id cant be passed in from search query?
  // Why 2 $
  // Why queryParams.length? does query params as opposed to options not contain previous things
  if (options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `
    AND properties.owner_id = $${options.owner_id}`;
  }

  if (options.minimum_price_per_night) {
    queryParams.push(`${options.minimum_price_per_night}`);
    queryString += `
    AND properties.cost_per_night/100 > $${queryParams.length}`;
  }

  if (options.maximum_price_per_night) {
    queryParams.push(`${options.maximum_price_per_night}`);
    queryString += `
    AND properties.cost_per_night/100 < $${queryParams.length}`;
  }

  queryString += `
  GROUP BY properties.id`

  if (options.minimum_rating) {
    queryParams.push(`${options.minimum_rating}`);
    queryString += `
    HAVING avg(property_reviews.rating) >= $${queryParams.length}`;
  }

  queryParams.push(limit);
  queryString += `
  ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;
 
  console.log(queryString, queryParams);

  return pool.query(queryString, queryParams).then((res) => res.rows);
  
  // return pool
  //   .query( `SELECT * FROM properties LIMIT $1`,[limit])
  //   .then((result) => {
  //     return (result.rows);
  //   })
  //   .catch((err) => {
  //     return (err.message);
  //   });
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {

  const values = Object.values(property);
  console.log(values);
  console.log('PROPERTY ', property)
  let queryString = `
  INSERT INTO properties (title, description, number_of_bedrooms, number_of_bathrooms, parking_spaces, cost_per_night, thumbnail_photo_url, cover_photo_url, street, country, city, province, post_code, owner_id) 
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
  RETURNING *
  `;
  return pool
    .query(queryString, values)
    .then(result => result.rows)
    .catch(err => err.message);

}
exports.addProperty = addProperty;
