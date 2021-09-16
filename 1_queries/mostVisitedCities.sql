SELECT properties.city, COUNT(reservations.id) AS total_reservations
FROM properties
JOIN reservations
ON properties.id = reservations.property_id
GROUP BY properties.city
ORDER BY COUNT(reservations.id) DESC;