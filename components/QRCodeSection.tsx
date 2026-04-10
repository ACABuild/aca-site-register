'use client'

import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { Download, QrCode, ExternalLink, Copy, Check } from 'lucide-react'

interface Props {
  jobId: string
  jobName: string
  jobNumber: string
}

export default function QRCodeSection({ jobId, jobName, jobNumber }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [copied, setCopied] = useState(false)

  const siteUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/site/${jobId}`
    : `${process.env.NEXT_PUBLIC_APP_URL}/site/${jobId}`

  useEffect(() => {
    QRCode.toDataURL(siteUrl, {
      width: 400,
      margin: 2,
      color: { dark: '#2C1706', light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    }).then(setQrDataUrl)
  }, [siteUrl])

  async function downloadQR() {
    if (!qrDataUrl) return

    // Create a printable page with logo + QR
    const canvas = document.createElement('canvas')
    canvas.width  = 600
    canvas.height = 780
    const ctx = canvas.getContext('2d')!

    // Background
    ctx.fillStyle = '#2C1706'
    ctx.fillRect(0, 0, 600, 780)

    // White card
    ctx.fillStyle = '#FFFFFF'
    ctx.roundRect(30, 30, 540, 720, 20)
    ctx.fill()

    // Logo area (sepia strip)
    ctx.fillStyle = '#2C1706'
    ctx.roundRect(30, 30, 540, 100, [20, 20, 0, 0])
    ctx.fill()

    // Title text
    ctx.fillStyle = '#F7F2EA'
    ctx.font = 'bold 22px Inter, Arial'
    ctx.textAlign = 'center'
    ctx.fillText('ACA BUILD', 300, 72)
    ctx.fillStyle = '#C4A882'
    ctx.font = '14px Inter, Arial'
    ctx.fillText('SITE REGISTER', 300, 98)

    // QR code
    const qrImg = new Image()
    qrImg.src = qrDataUrl
    await new Promise(r => { qrImg.onload = r })
    ctx.drawImage(qrImg, 100, 150, 400, 400)

    // Job details
    ctx.fillStyle = '#2C1706'
    ctx.font = 'bold 20px Inter, Arial'
    ctx.textAlign = 'center'
    ctx.fillText(jobName, 300, 595)

    ctx.fillStyle = '#C4A882'
    ctx.font = '14px Inter, Arial'
    ctx.fillText(`Job #${jobNumber}`, 300, 620)

    ctx.fillStyle = '#3B2314'
    ctx.font = '13px Inter, Arial'
    ctx.fillText('Scan to sign in', 300, 650)

    ctx.fillStyle = '#C4A882'
    ctx.font = '11px Inter, Arial'
    ctx.fillText(siteUrl, 300, 720)

    const link = document.createElement('a')
    link.download = `QR-${jobNumber}-${jobName.replace(/[^a-z0-9]/gi, '_')}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  async function copyLink() {
    await navigator.clipboard.writeText(siteUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="card">
      <h2 className="font-bold text-carbon mb-4 flex items-center gap-2">
        <QrCode size={16}/> QR Code
      </h2>

      {qrDataUrl ? (
        <div className="flex flex-col items-center">
          <div className="bg-white rounded-xl p-3 shadow-md border-2 border-cream mb-3">
            <img src={qrDataUrl} alt="QR Code" className="w-48 h-48 sm:w-56 sm:h-56" />
          </div>

          <p className="text-tan text-xs text-center mb-4 px-2">
            Print this and place it at the front of the site. Trades scan to sign in.
          </p>

          <div className="space-y-2 w-full">
            <button onClick={downloadQR}
              className="btn-primary flex items-center justify-center gap-2 text-sm py-2.5">
              <Download size={16}/> Download QR Poster
            </button>

            <button onClick={copyLink}
              className="btn-secondary flex items-center justify-center gap-2 text-sm py-2.5">
              {copied ? <><Check size={16} className="text-green-600"/> Copied!</> : <><Copy size={16}/> Copy Link</>}
            </button>

            <a href={siteUrl} target="_blank" rel="noopener noreferrer"
              className="btn-ghost flex items-center justify-center gap-2 text-sm py-2">
              <ExternalLink size={15}/> Preview Sign-in Page
            </a>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-sepia border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  )
}
