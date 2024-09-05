// app/api/try-on/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Client, handle_file } from "@gradio/client";
import AWS from 'aws-sdk';

async function uploadToS3(file: File): Promise<string> {
  const s3 = new AWS.S3({
    endpoint: process.env.CLOUDFLARE_R2_ENDPOINT,
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
    signatureVersion: 'v4',
    s3ForcePathStyle: true,  // Required for R2 compatibility
  });

  const fileName = file.name;
  const fileContent = await file.arrayBuffer();

  const uploadParams = {
    Bucket: 'ai-try-on', // Your Cloudflare R2 bucket name
    Key: fileName,
    Body: Buffer.from(fileContent), // Convert ArrayBuffer to Buffer
    ContentType: file.type,
  };

  try {
    // Upload the file to Cloudflare R2
    await s3.upload(uploadParams).promise();

    // Generate a pre-signed URL (temporary access to the file)
    const signedUrlParams = {
      Bucket: uploadParams.Bucket,
      Key: fileName,
      Expires: 60 * 60, // URL expiration in seconds (1 hour)
    };

    // Generate the pre-signed URL
    const url = await s3.getSignedUrlPromise('getObject', signedUrlParams);

    return url; // Return the pre-signed URL
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
}


async function processImages(personImageBuffer: string, garmentImageBuffer: string): Promise<string> {
  try {
    // Convert buffers to blobs
    // const personImageBlob = new Blob([personImageBuffer], { type: 'image/png' });
    // const garmentImageBlob = new Blob([garmentImageBuffer], { type: 'image/png' });

    // Initialize the Gradio client
    const app = await Client.connect("yisol/IDM-VTON");

    // Predict using the IDM-VTON model
    const result = await app.predict("/tryon", [
      {"background": handle_file(personImageBuffer), "layers": [], "composite": null},
      handle_file(garmentImageBuffer),
      "Processing image", // Text parameter
      true, // Checkbox parameter
      true, // Checkbox parameter
      30, // Denoising Steps
      42, // Seed
    ]);

    // Return the URL of the processed image
    return (result.data as { url: string }[])[0].url;
  } catch (error) {
    console.error('Error in processImages:', error);
    throw error;
  }
}


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const personImage = formData.get('personImage') as File;
    const garmentImage = formData.get('garmentImage') as File;

    if (!personImage || !garmentImage) {
      return NextResponse.json({ error: 'Both person and garment images are required' }, { status: 400 });
    }

    // const personImageBuffer = await personImage.arrayBuffer();
    // const garmentImageBuffer = await garmentImage.arrayBuffer();
    const personImageURL = await uploadToS3(personImage);
    const garmentImageURL = await uploadToS3(garmentImage);

    // Process the images and get the result URL
    const resultImageUrl = await processImages(personImageURL, garmentImageURL);

    return NextResponse.json({ 
      message: 'Images processed successfully',
      resultImage: resultImageUrl
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing images:', error);
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 });
  }
}