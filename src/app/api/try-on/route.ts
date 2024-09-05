// app/api/try-on/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { Client, handle_file } from "@gradio/client";

async function processImages(personImageBuffer: ArrayBuffer, garmentImageBuffer: ArrayBuffer): Promise<string> {
  try {
    // Convert buffers to blobs
    const personImageBlob = new Blob([personImageBuffer], { type: 'image/png' });
    const garmentImageBlob = new Blob([garmentImageBuffer], { type: 'image/png' });

    // Initialize the Gradio client
    const app = await Client.connect("yisol/IDM-VTON");

    // Predict using the IDM-VTON model
    const result = await app.predict("/tryon", [
      {"background": handle_file(personImageBlob), "layers": [], "composite": null},
      handle_file(garmentImageBlob),
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

    const personImageBuffer = await personImage.arrayBuffer();
    const garmentImageBuffer = await garmentImage.arrayBuffer();

    // Process the images and get the result URL
    const resultImageUrl = await processImages(personImageBuffer, garmentImageBuffer);

    return NextResponse.json({ 
      message: 'Images processed successfully',
      resultImage: resultImageUrl
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing images:', error);
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 });
  }
}