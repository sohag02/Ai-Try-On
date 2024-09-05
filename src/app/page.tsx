"use client"
import { useState, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Upload, Shirt, ShieldCheck, Loader2, X, Github, Download } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

export default function LandingPage() {
  const [personImage, setPersonImage] = useState<File | null>(null)
  const [garmentImage, setGarmentImage] = useState<File | null>(null)
  const [personPreview, setPersonPreview] = useState<string | null>(null)
  const [garmentPreview, setGarmentPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null)
  const [isResultLoading, setIsResultLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageUpload = useCallback((setter: React.Dispatch<React.SetStateAction<File | null>>, previewSetter: React.Dispatch<React.SetStateAction<string | null>>) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setter(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        previewSetter(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }, [])

  const handlePersonImageUpload = handleImageUpload(setPersonImage, setPersonPreview)
  const handleGarmentImageUpload = handleImageUpload(setGarmentImage, setGarmentPreview)

  const handleProcessing = async () => {
    if (!personImage || !garmentImage) return

    setIsProcessing(true)
    setResultImageUrl(null)
    setError(null)

    const formData = new FormData()
    formData.append('personImage', personImage)
    formData.append('garmentImage', garmentImage)

    try {
      const response = await fetch('/api/try-on', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        throw new Error('Failed to process images')
      }

      const result = await response.json()
      setResultImageUrl(result.resultImage)
      setIsResultLoading(true)
    } catch (error) {
      console.error('Error:', error)
      setError('An error occurred while processing the images. Please try again.')
    } finally {
      setIsProcessing(false)
    }
  }

  const clearImage = useCallback((setter: React.Dispatch<React.SetStateAction<File | null>>, previewSetter: React.Dispatch<React.SetStateAction<string | null>>) => () => {
    setter(null)
    previewSetter(null)
  }, [])

  const downloadImage = useCallback((url: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'result.png'); // Ensures the download attribute is set
    link.setAttribute('target', '_blank'); // Opens in a new tab in case it's necessary
    document.body.appendChild(link); // Append link to body for it to work in Firefox
    link.click();
    document.body.removeChild(link); // Clean up after the download is triggered
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <Link href="/" className="flex items-center space-x-2">
          <Shirt className="h-8 w-8" />
          <span className="text-2xl font-bold">AI Try-On</span>
        </Link>
        <nav className="space-x-4">
          <Link href="https://github.com/sohag02/Ai-Try-On">
            <Button variant="outline">
              <Github className="mr-2 h-4 w-4" /> Github
            </Button>
          </Link>
        </nav>
      </header>

      <main>
        <section className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-5xl font-bold mb-6">Try On Clothes Virtually with AI</h1>
          <p className="text-xl mb-8 text-gray-400">Upload your photo and a garment to see how you would look!</p>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Person Image Upload */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <Label htmlFor="person-upload" className="block text-lg mb-4">Upload Your Photo</Label>
              <div className="relative">
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-500 transition-colors">
                  <Input id="person-upload" type="file" className="hidden" onChange={handlePersonImageUpload} />
                  {personPreview ? (
                    <Image src={personPreview} alt="Person preview" width={200} height={200} className="mx-auto rounded-lg" />
                  ) : (
                    <>
                      <Upload className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                      <p className="text-gray-500">Drag and drop your photo here, or click to select</p>
                      <Button className="w-full mt-2" onClick={() => document.getElementById('person-upload')?.click()}>
                        <Upload className="mr-2 h-4 w-4" /> Upload Your Photo
                      </Button>
                    </>
                  )}
                </div>
                {personPreview && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-gray-800 rounded-full"
                    onClick={clearImage(setPersonImage, setPersonPreview)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Garment Image Upload */}
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <Label htmlFor="garment-upload" className="block text-lg mb-4">Upload Garment Image</Label>
              <div className="relative">
                <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-gray-500 transition-colors">
                  <Input id="garment-upload" type="file" className="hidden" onChange={handleGarmentImageUpload} />
                  {garmentPreview ? (
                    <Image src={garmentPreview} alt="Garment preview" width={200} height={200} className="mx-auto rounded-lg" />
                  ) : (
                    <>
                      <Shirt className="mx-auto h-12 w-12 text-gray-500 mb-4" />
                      <p className="text-gray-500">Drag and drop garment image here, or click to select</p>
                      <Button className="w-full mt-2" onClick={() => document.getElementById('garment-upload')?.click()}>
                        <Upload className="mr-2 h-4 w-4" /> Upload Your Photo
                      </Button>
                    </>
                  )}
                </div>
                {garmentPreview && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 bg-gray-800 rounded-full"
                    onClick={clearImage(setGarmentImage, setGarmentPreview)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="mt-8">
            <Button 
              onClick={handleProcessing} 
              disabled={!personImage || !garmentImage || isProcessing}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Start Processing'
              )}
            </Button>
          </div>

          {error && (
            <div className="mt-4 text-red-500">
              {error}
            </div>
          )}

          {resultImageUrl && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Result</h2>
              <div className="relative w-[400px] h-[400px] mx-auto">
                {isResultLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-50 rounded-lg">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                  </div>
                )}
                <Image
                  src={resultImageUrl}
                  alt="Processed Image"
                  width={400}
                  height={400}
                  className="mx-auto rounded-lg"
                  onLoad={() => setIsResultLoading(false)}
                />
              </div>
              {/* Download Button */}
              <Button
                variant="secondary"
                className="mt-4 w-[400px] text-xl"
                onClick={() => downloadImage(resultImageUrl)}
              >
                <Download className="mr-4 h-6 w-6" /> Download Image
              </Button>
            </div>
          )}

          <div className="mt-6 flex items-center justify-center text-gray-400">
            <ShieldCheck className="h-5 w-5 mr-2" />
            <p className="text-sm">We respect your privacy. Images are not stored and are deleted after processing.</p>
          </div>
        </section>

      </main>

      <footer className="bg-gray-900 text-gray-400 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <Link href="/" className="flex items-center space-x-2">
                <Shirt className="h-6 w-6" />
                <span className="text-xl font-bold text-white">AI Try-On</span>
              </Link>
            </div>
            <nav className="flex space-x-4">
              <Link href="https://github.com/sohag02/Ai-Try-On" className="hover:text-gray-300">Made By @Sohag02</Link>
            </nav>
          </div>
          <div className="mt-4 text-center text-sm">
            © {new Date().getFullYear()} AI Try-On. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}