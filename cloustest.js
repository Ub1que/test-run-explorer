// Imports the Google Cloud client library
const { Storage } = require("@google-cloud/storage");

// For more information on ways to initialize Storage, please see
// https://googleapis.dev/nodejs/storage/latest/Storage.html

// Creates a client using Application Default Credentials
// const storage = new Storage();

// Creates a client from a Google service account key
const storage = new Storage({
  keyFilename: "logical-lock-203412-74da5e5bea73.json",
});

/**
 * TODO(developer): Uncomment these variables before running the sample.
 */
// The ID of your GCS bucket
// const bucketName = 'your-unique-bucket-name';

// async function createBucket() {
//   // Creates the new bucket
//   storage.
//   console.log("21: ", const buckets = await storage.getBuckets({}));
//   // await storage.createBucket(bucketName);
//   // console.log(`Bucket ${bucketName} created.`);
// }

async function downloadIntoMemory() {
  // Downloads the file into a buffer in memory.
  // const contents = await storage.bucket('test_results_bucket').file(fileName).download();

  const contents = await storage.bucket("test_results_bucket").getFiles();

  console.log("35: ", contents);

  // console.log(
  //   `Contents of gs://${bucketName}/${fileName} are ${contents.toString()}.`
  // );
}

downloadIntoMemory().catch(console.error);
