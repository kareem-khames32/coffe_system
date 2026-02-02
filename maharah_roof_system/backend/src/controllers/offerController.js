const db = require('../config/database');

// Get all offers
exports.getAllOffers = async (req, res) => {
    try {
        const [offers] = await db.query(
            'SELECT * FROM offers ORDER BY created_at DESC'
        );

        res.json({
            success: true,
            data: offers
        });
    } catch (error) {
        console.error('Get offers error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get active offers (for online orders - no auth required)
exports.getActiveOffers = async (req, res) => {
    try {
        const [offers] = await db.query(
            `SELECT * FROM offers
             WHERE is_active = TRUE
             AND start_date <= CURDATE()
             AND end_date >= CURDATE()
             ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            data: offers
        });
    } catch (error) {
        console.error('Get active offers error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Get offer by ID
exports.getOfferById = async (req, res) => {
    try {
        const [offers] = await db.query(
            'SELECT * FROM offers WHERE id = ?',
            [req.params.id]
        );

        if (offers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Offer not found'
            });
        }

        res.json({
            success: true,
            data: offers[0]
        });
    } catch (error) {
        console.error('Get offer error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Create offer
exports.createOffer = async (req, res) => {
    try {
        const {
            name,
            description,
            offer_type,
            discount_value,
            buy_quantity,
            get_quantity,
            image,
            start_date,
            end_date
        } = req.body;

        if (!name || !offer_type || !start_date || !end_date) {
            return res.status(400).json({
                success: false,
                message: 'Name, offer type, start date, and end date are required'
            });
        }

        // Convert ISO string dates to DATE format (YYYY-MM-DD)
        const startDateOnly = new Date(start_date).toISOString().split('T')[0];
        const endDateOnly = new Date(end_date).toISOString().split('T')[0];

        const [result] = await db.query(
            `INSERT INTO offers (name, description, offer_type, discount_value, buy_quantity,
             get_quantity, image, start_date, end_date)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                description || null,
                offer_type,
                discount_value || null,
                buy_quantity || null,
                get_quantity || null,
                image || null,
                startDateOnly,
                endDateOnly
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Offer created successfully',
            data: { id: result.insertId }
        });
    } catch (error) {
        console.error('Create offer error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Update offer
exports.updateOffer = async (req, res) => {
    try {
        const {
            name,
            description,
            offer_type,
            discount_value,
            buy_quantity,
            get_quantity,
            image,
            start_date,
            end_date,
            is_active
        } = req.body;

        // Check if offer exists
        const [offers] = await db.query('SELECT id FROM offers WHERE id = ?', [req.params.id]);

        if (offers.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Offer not found'
            });
        }

        let updateQuery = 'UPDATE offers SET ';
        const updateValues = [];

        if (name) {
            updateQuery += 'name = ?, ';
            updateValues.push(name);
        }

        if (description !== undefined) {
            updateQuery += 'description = ?, ';
            updateValues.push(description);
        }

        if (offer_type) {
            updateQuery += 'offer_type = ?, ';
            updateValues.push(offer_type);
        }

        if (discount_value !== undefined) {
            updateQuery += 'discount_value = ?, ';
            updateValues.push(discount_value);
        }

        if (buy_quantity !== undefined) {
            updateQuery += 'buy_quantity = ?, ';
            updateValues.push(buy_quantity);
        }

        if (get_quantity !== undefined) {
            updateQuery += 'get_quantity = ?, ';
            updateValues.push(get_quantity);
        }

        if (image !== undefined) {
            updateQuery += 'image = ?, ';
            updateValues.push(image);
        }

        if (start_date) {
            updateQuery += 'start_date = ?, ';
            // Convert ISO string to DATE format (YYYY-MM-DD)
            const dateOnly = new Date(start_date).toISOString().split('T')[0];
            updateValues.push(dateOnly);
        }

        if (end_date) {
            updateQuery += 'end_date = ?, ';
            // Convert ISO string to DATE format (YYYY-MM-DD)
            const dateOnly = new Date(end_date).toISOString().split('T')[0];
            updateValues.push(dateOnly);
        }

        if (is_active !== undefined) {
            updateQuery += 'is_active = ?, ';
            updateValues.push(is_active);
        }

        updateQuery = updateQuery.slice(0, -2) + ' WHERE id = ?';
        updateValues.push(req.params.id);

        await db.query(updateQuery, updateValues);

        res.json({
            success: true,
            message: 'Offer updated successfully'
        });
    } catch (error) {
        console.error('Update offer error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// Delete offer
exports.deleteOffer = async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM offers WHERE id = ?', [req.params.id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: 'Offer not found'
            });
        }

        res.json({
            success: true,
            message: 'Offer deleted successfully'
        });
    } catch (error) {
        console.error('Delete offer error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};
