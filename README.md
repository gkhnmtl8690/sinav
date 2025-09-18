# Okul Yönetim Sistemi (School Management System)

Bu proje, eğitim kurumları için kapsamlı bir okul yönetim sistemi uygulamasıdır.

## 🚀 Otomatik APK Oluşturma (GitHub Actions)

Bu proje GitHub Actions kullanarak otomatik APK oluşturma özelliğine sahiptir.

### Nasıl Çalışır?

1. **Kod Push/Pull Request**: `main` veya `master` branch'ine kod gönderdiğinizde otomatik olarak APK oluşturulur
2. **Manual Tetikleme**: GitHub'da "Actions" sekmesinden manuel olarak build başlatabilirsiniz
3. **Otomatik Release**: `main` branch'e push yapıldığında otomatik release oluşturulur

### APK İndirme

- **Artifacts**: Her build sonrası APK dosyalarını "Actions" > "Build" > "Artifacts" bölümünden indirebilirsiniz
- **Releases**: Otomatik oluşturulan release'lerden APK indirebilirsiniz

### Desteklenen Özellikler

- ✅ Debug ve Release APK oluşturma
- ✅ Otomatik Android SDK kurulumu
- ✅ Cordova ve plugin kurulumları
- ✅ APK imzalama
- ✅ Artifact yükleme (30 gün saklama)
- ✅ Otomatik release oluşturma

## 🔧 Local Geliştirme

### Gereksinimler

- Node.js 18+
- Android Studio / Android SDK
- Cordova CLI

### Kurulum

```bash
# Cordova CLI kurulumu
npm install -g cordova

# Proje bağımlılıklarını yükle
cd okul-app
npm install

# Android platform ekle
cordova platform add android

# APK oluştur
npm run build
```

### Build Komutları

```bash
# Debug APK
npm run build:debug

# Release APK  
npm run build:release

# Platform hazırlama
npm run prepare
```

## 📱 Uygulama Özellikleri

- **Okul Yönetimi**: Çoklu okul desteği
- **Sınıf Organizasyonu**: Sınıf ve öğrenci yönetimi
- **Değerlendirme Sistemi**: 5-8. sınıf akademik kriterler
- **Sınav Sistemi**: Kapsamlı sınav yönetimi
- **Raporlama**: Detaylı analiz ve raporlar

## 🌐 Web Versiyonu

Proje aynı zamanda web tabanlı bir versiyona sahiptir:

```bash
cd HTML-CSS-JS-Static
npm start
```

Web uygulaması `http://localhost:5000` adresinde çalışacaktır.

## 📄 Lisans

Bu proje MIT lisansı altında lisanslanmıştır.