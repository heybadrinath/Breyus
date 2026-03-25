import mongoose from 'mongoose';

/**
 * Reset trade to PAYMENT stage for testing payment proof upload
 * This removes the payment proof and sets the trade phase back to PAYMENT
 */
async function resetTradeToPayment() {
  const mongoUri =
    process.env.MONGODB_URI_DEV ||
    'mongodb+srv://badri:mongodb@breyus.5tfwoeg.mongodb.net/breyus?retryWrites=true&w=majority';

  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db!;
    const tradesCollection = db.collection('trades');

    // Find the most recent trade that's not completed
    const trade = await tradesCollection.findOne(
      { tradePhase: { $ne: 'COMPLETED' } },
      { sort: { createdAt: -1 } },
    );

    if (!trade) {
      console.log('No active trade found. Looking for any trade...');
      const anyTrade = await tradesCollection.findOne(
        {},
        { sort: { createdAt: -1 } },
      );
      if (!anyTrade) {
        console.log('No trades found in database');
        return;
      }
      console.log('Found trade:', anyTrade._id);
    } else {
      console.log('Found active trade:', trade._id);
      console.log('Current phase:', trade.tradePhase);
      console.log('Has payment proof:', !!trade.paymentProof);
    }

    const tradeId =
      trade?._id ||
      (await tradesCollection.findOne({}, { sort: { createdAt: -1 } }))?._id;

    if (!tradeId) {
      console.log('No trade ID found');
      return;
    }

    // Reset trade to PAYMENT phase and remove payment proof
    const updateResult = await tradesCollection.updateOne(
      { _id: tradeId },
      {
        $set: {
          tradePhase: 'PAYMENT',
        },
        $unset: {
          paymentProof: '',
          paymentVerifiedAt: '',
          bolDocument: '',
          bolUploadedAt: '',
        },
      },
    );

    console.log('Update result:', updateResult);

    // Verify the update
    const updatedTrade = await tradesCollection.findOne({ _id: tradeId });
    console.log('\nTrade reset successfully!');
    console.log('New phase:', updatedTrade?.tradePhase);
    console.log('Payment proof removed:', !updatedTrade?.paymentProof);
    console.log('\nYou can now test uploading payment proof again.');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

resetTradeToPayment();
