const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://ravindusenanayake3415_db_user:wXl9SaRrJyPwusen@cluster0.iazs7qg.mongodb.net/juice-bar-pos?retryWrites=true&w=majority&appName=Cluster0').then(async () => {
  const db = mongoose.connection.db;
  const res = await db.collection('grns').deleteMany({ grnNumber: { $in: ['TEST-123', 'TEST-124'] } });
  console.log('Deleted:', res.deletedCount);
  mongoose.disconnect();
}).catch(console.error);
