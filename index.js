require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const axios = require('axios');
const mongoose = require('mongoose');

let db;
mongoose.connect(process.env.mongodb_uri).then(() => {
    console.log('✅ Connected to MongoDB');
    db = mongoose.connection.db;
}).catch(err => {
    console.error('❌ MongoDB connection error:', err);
});
 
app.use(express.json());
app.use(express.static(path.join(__dirname, 'valentine.github.io-main')));

app.get('/api/get-girl-name', (req, res) => {
    res.json({
        name: process.env.girl_name_ru
    });
});

app.post('/api/send-telegram', async (req, res) => {
    let { message, girlName } = req.body;
    if (!message) {
        const collection = db.collection('dating');
        const foundObject = await collection.findOne({ girlName: girlName });
        
        message = "A date is set with " + girlName + "\n" +
                "Date: " + foundObject.date + "\n";
        
        message += "Food: ";
        for (food of foundObject.foods) {
            message += (food + ', ');
        }
        message += "\n";

        message += "Desserts: ";
        for (dessert of foundObject.desserts) {
            message += (dessert + ', ');
        }
        message += "\n";

        message += "Activities: ";
        for (act of foundObject.activities) {
            message += (act + ', ');
        }
    }

    const token = process.env.telegram_bot_hash;
    const chatId = process.env.admin_chat_id;
    const url = `https://api.telegram.org/bot${token}/sendMessage?parse_mode=HTML`;

    try {
        const response = await axios.post(url, {
            chat_id: chatId,
            text: message,
        });
                
        res.json({
            chat_id: chatId,
            message: message,
            success: response.data.ok
        });
    } catch (error) {
        let errorMessage = error.response?.data || error.message;

        console.error('Telegram API error:', errorMessage);
        await axios.post(url, {
            chat_id: process.env.admin_chat_id,
            text: "Зафиксирован инцидент при отправке сообщения " + chatId +": \n<code>" + JSON.stringify(errorMessage) + "</code>",
        });

        res.status(500).json({ success: false, error: 'Failed to send message to Telegram' });
    }
});

app.post('/api/set-date', async (req, res) => {
    const { girlName, date } = req.body;
    const collection = db.collection('dating');

    const result = await collection.updateOne(
        { girlName: girlName },                 // search criteria
        { $set: { date: date } },               // fields to update
        { upsert: true }                        // create if not exists
    );

    res.status(200).json({
        success: true,
        upserted: result.upsertedCount > 0,
        modified: result.modifiedCount > 0
    });
});

app.post('/api/set-food', async (req, res) => {
    const { girlName, foods } = req.body;
    const collection = db.collection('dating');

    const result = await collection.updateOne(
        { girlName: girlName },                 // search criteria
        { $set: { foods: foods } },               // fields to update
        { upsert: true }                        // create if not exists
    );

    res.status(200).json({
        success: true,
        upserted: result.upsertedCount > 0,
        modified: result.modifiedCount > 0
    });
});


app.post('/api/set-activities', async (req, res) => {
    const { girlName, activities } = req.body;
    const collection = db.collection('dating');

    const result = await collection.updateOne(
        { girlName: girlName },                 // search criteria
        { $set: { activities: activities } },               // fields to update
        { upsert: true }                        // create if not exists
    );

    res.status(200).json({
        success: true,
        upserted: result.upsertedCount > 0,
        modified: result.modifiedCount > 0
    });
});


app.post('/api/set-dessert', async (req, res) => {
    const { girlName, desserts } = req.body;
    const collection = db.collection('dating');

    const result = await collection.updateOne(
        { girlName: girlName },                 // search criteria
        { $set: { desserts: desserts } },               // fields to update
        { upsert: true }                        // create if not exists
    );

    res.status(200).json({
        success: true,
        upserted: result.upsertedCount > 0,
        modified: result.modifiedCount > 0
    });
});

const port = 3000;
app.listen(port, () => {
    console.log("App running on port " + port);
});