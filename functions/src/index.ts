import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
const nodemailer = require('nodemailer');
/* tslint:disable */
admin.initializeApp();

const firestore = admin.firestore();

export const sendEmailOnOrderCreation = functions.firestore.document('/orders/{orderId}').onCreate(async (snapshot, context) => {


    const order = snapshot.data() || {};
    const storeId = order.storeId;

    const storeData = await firestore.collection('store').doc(storeId).get();

    const storeEmail = (storeData && storeData.data()) ? storeData.data()!.userName : '';

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: 'outlettr123@gmail.com',
            pass: 'Outlettr@12345678'
        }
    });

    let orderDetailsString = '';
    order.products.forEach((product: any) => {
        orderDetailsString +=   `Item: ${product.name} \t Price: ${product.price} \t Shipping: ${product.shippingDetails[0].name}\n`;
    });
    // send mail with defined transport object
    transporter.sendMail({
        from: '"Order Details" <outlettr123@gmail.com>', // sender address
        to: `${order.email}, ${storeEmail}`, // list of receivers
        subject: `Order Placed Successfully: Order Id: ${context.params.orderId}`, // Subject line
        text: `Hello: \n an order has been placed by ${order.email} here are the details\n${orderDetailsString}\n\n\n\nThanks,\n Outlettr Team`, // plain text body
    }).then((info: any) => {
        console.log('Message sent: %s', info.messageId + `\n${orderDetailsString} \nUser: ${order.email}, Store: ${storeEmail}`);

        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    });

    return '';
});

export const generateCategories = functions.database.ref('/store').onUpdate(event => {
    firestore.collection('store/{store}').get().then(snapshot => {
        let categories: string[] = [];
        snapshot.forEach(doc => {
            categories.push(...doc.data().categories);
        });

        categories = [...new Set(categories)];

        return firestore.collection('categories')
            .doc('3L03BAMl5fTq3kspuxlv')
            .set({categories: categories});

    }) .catch(error => {
        return error;
    });
});

export const generateSearchableStoreNames = functions.firestore.document('/store/{store}').onCreate(async (snapshot, context)  => {
    const data = snapshot.data() || {};
    const storeName = data.name || '';
    const searchableString: string[] = [];

    let storeNameProgressive = '';
    storeName.forEach((character: string) => {
        storeNameProgressive = storeNameProgressive + character;
        searchableString.push(storeNameProgressive);
    });

    return firestore.collection('/store').doc(data.id).set({
        searchableString: searchableString
    }, {merge: true});
});

