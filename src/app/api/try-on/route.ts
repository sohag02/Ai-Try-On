// app/api/try-on/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, mkdir, unlink } from 'fs/promises';
import path from 'path';
import { Client, handle_file } from "@gradio/client";

async function ensureDirectoryExists(dirPath: string) {
  try {
    await mkdir(dirPath, { recursive: true });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error;
    }
  }
}

async function processImages(personImagePath: string, garmentImagePath: string): Promise<string> {
  try {
    // Read the uploaded images
    const personImageBuffer = await readFile(personImagePath);
    const garmentImageBuffer = await readFile(garmentImagePath);

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
  const tmpFiles: string[] = [];
  try {
    const formData = await request.formData();
    const personImage = formData.get('personImage') as File;
    const garmentImage = formData.get('garmentImage') as File;

    if (!personImage || !garmentImage) {
      return NextResponse.json({ error: 'Both person and garment images are required' }, { status: 400 });
    }

    // Create a temporary directory to store uploaded files
    const tmpDir = path.join(process.cwd(), 'tmp');
    await ensureDirectoryExists(tmpDir);

    const personImagePath = path.join(tmpDir, personImage.name);
    const garmentImagePath = path.join(tmpDir, garmentImage.name);

    tmpFiles.push(personImagePath, garmentImagePath);

    await writeFile(personImagePath, Buffer.from(await personImage.arrayBuffer()));
    await writeFile(garmentImagePath, Buffer.from(await garmentImage.arrayBuffer()));

    // Process the images and get the result URL
    const resultImageUrl = await processImages(personImagePath, garmentImagePath);

    return NextResponse.json({ 
      message: 'Images processed successfully',
      resultImage: resultImageUrl
    }, { status: 200 });

  } catch (error) {
    console.error('Error processing images:', error);
    return NextResponse.json({ error: 'Internal server error', details: (error as Error).message }, { status: 500 });
  } finally {
    // Delete temporary files
    for (const file of tmpFiles) {
      try {
        await unlink(file);
      } catch (error) {
        console.error(`Failed to delete temporary file ${file}:`, error);
      }
    }
  }
}