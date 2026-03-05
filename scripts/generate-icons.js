const sharp = require('sharp')
const path = require('path')
const fs = require('fs')

const sizes = [72, 96, 128, 144, 152, 192, 384, 512]
const inputImage = path.join(__dirname, '..', 'public', 'logo-neura.png')
const outputDir = path.join(__dirname, '..', 'public', 'icons')

async function generate() {
    // Garantir que a pasta existe
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
    }

    // Verificar se a imagem existe
    if (!fs.existsSync(inputImage)) {
        console.error('❌ Arquivo logo-neura.png não encontrado em public/')
        console.error('   Salve a imagem do logo como: public/logo-neura.png')
        process.exit(1)
    }

    console.log('🎨 Gerando ícones a partir de logo-neura.png...\n')

    // Gerar ícones PWA/manifest
    for (const size of sizes) {
        const outputPath = path.join(outputDir, `icon-${size}x${size}.png`)
        await sharp(inputImage)
            .resize(size, size, {
                fit: 'cover',
                position: 'center',
            })
            .png({ quality: 100, compressionLevel: 9 })
            .toFile(outputPath)
        console.log(`  ✅ icon-${size}x${size}.png`)
    }

    // Gerar favicon
    await sharp(inputImage)
        .resize(32, 32, { fit: 'cover', position: 'center' })
        .png({ quality: 100 })
        .toFile(path.join(outputDir, 'favicon-32x32.png'))
    console.log(`  ✅ favicon-32x32.png`)

    await sharp(inputImage)
        .resize(16, 16, { fit: 'cover', position: 'center' })
        .png({ quality: 100 })
        .toFile(path.join(outputDir, 'favicon-16x16.png'))
    console.log(`  ✅ favicon-16x16.png`)

    // Gerar apple-touch-icon (180x180)
    await sharp(inputImage)
        .resize(180, 180, { fit: 'cover', position: 'center' })
        .png({ quality: 100 })
        .toFile(path.join(outputDir, 'apple-touch-icon.png'))
    console.log(`  ✅ apple-touch-icon.png (180x180)`)

    // Gerar OG image (para compartilhamento social - 1200x630)
    const ogWidth = 1200
    const ogHeight = 630
    const logoSize = 300

    const resizedLogo = await sharp(inputImage)
        .resize(logoSize, logoSize, { fit: 'contain', background: { r: 11, g: 13, b: 16, alpha: 1 } })
        .toBuffer()

    await sharp({
        create: {
            width: ogWidth,
            height: ogHeight,
            channels: 4,
            background: { r: 11, g: 13, b: 16, alpha: 255 },
        },
    })
        .composite([
            {
                input: resizedLogo,
                left: Math.round((ogWidth - logoSize) / 2),
                top: Math.round((ogHeight - logoSize) / 2),
            },
        ])
        .png({ quality: 90 })
        .toFile(path.join(__dirname, '..', 'public', 'og-image.png'))

    console.log(`  ✅ og-image.png (1200x630) - para redes sociais`)
    console.log('\n🎉 Todos os ícones gerados com sucesso!')
    console.log(`📁 Pasta: ${outputDir}`)
}

generate().catch((err) => {
    console.error('❌ Erro:', err.message)
    process.exit(1)
})
