const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY?.replace(/['"]+/g, '').trim(),
    key_secret: process.env.RAZORPAY_SECRET_KEY?.replace(/['"]+/g, '').trim(),
});

const razorpayService = {
    /**
     * Create a Razorpay order
     * @param {number} amount - Amount in basic unit (i.e., Paise for INR)
     * @param {string} receipt - Receipt ID/Invoice ID
     */
    createOrder: async (amount, receipt) => {
        const options = {
            amount: Math.round(amount * 100), // convert to paise
            currency: 'INR',
            receipt: receipt,
        };

        try {
            const order = await razorpay.orders.create(options);
            return order;
        } catch (error) {
            console.error('Razorpay Create Order Error:', error);
            throw new Error(error.description || 'Failed to create Razorpay order');
        }
    },

    /**
     * Verify Razorpay signature
     */
    verifySignature: (order_id, payment_id, signature) => {
        const generated_signature = crypto
            .createHmac('sha256', process.env.RAZORPAY_SECRET_KEY?.replace(/['"]+/g, '').trim())
            .update(`${order_id}|${payment_id}`)
            .digest('hex');

        return generated_signature === signature;
    }
};

module.exports = razorpayService;
