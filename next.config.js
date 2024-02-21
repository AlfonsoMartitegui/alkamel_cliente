// module.exports = {
//     async headers() {
//       return [
//         {
//           source: '/(.*)',
//           headers: [
//             {
//               key: 'Set-Cookie',
//               value: 'SameSite=None; Secure; HttpOnly',
//             },
//           ],
//         },
//       ];
//     },
//   };
// const withImages = require('next-images');

// module.exports = withImages({
//   images: {
//     domains: ['pptrackerwww.s3.us-west-2.amazonaws.com'], // Agrega el nombre del host de tu imagen aquí
//   },
// });

module.exports = {
  images: {
    domains: ["pptrackerwww.s3.us-west-2.amazonaws.com"], // replace 'example.com' with the domain of your images
  },
};
