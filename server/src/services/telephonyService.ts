import { prisma } from '../prisma';

export type SupportedLanguage = 'hi' | 'en' | 'ta' | 'pb';

export interface TelephonyNotificationPayload {
  recipient: string;
  templateCode: 'TOKEN_CONFIRMATION' | 'GATE_CHECKIN' | 'QUEUE_CALLOUT' | 'QUEUE_AUTOSWAP' | 'PAYMENT_DEPOSITED' | 'QUALITY_RESULT';
  language?: SupportedLanguage;
  variables: Record<string, string>;
  channel?: 'SMS' | 'WHATSAPP' | 'VOICE_CALL';
}

class TelephonyService {
  private templates: Record<string, Record<SupportedLanguage, string>> = {
    TOKEN_CONFIRMATION: {
      hi: '[मंडीसिंक] टोकन पुष्टि: आपका टोकन #{tokenId} ({crop}, {quantity} क्विंटल) {centreName} के लिए बुक हो गया है। समय: {time}, कतार क्रम: #{queueNum}।',
      en: '[MandiSync] Token Confirmation: Your token #{tokenId} ({crop}, {quantity} Qtl) is confirmed for {centreName}. Scheduled: {time}, Queue #{queueNum}.',
      ta: '[மண்டிசின்க்] டோக்கன் உறுதி: உங்கள் டோக்கன் #{tokenId} ({crop}, {quantity} குவிண்டால்) {centreName} மண்டிக்கு உறுதி செய்யப்பட்டது. நேரம்: {time}, வரிசை: #{queueNum}.',
      pb: '[ਮੰਡੀਸਿੰਕ] ਟੋਕਨ ਪੁਸ਼ਟੀ: ਤੁਹਾਡਾ ਟੋਕਨ #{tokenId} ({crop}, {quantity} ਕੁਇੰਟਲ) {centreName} ਲਈ ਬੁੱਕ ਹੋ ਗਿਆ ਹੈ। ਸਮਾਂ: {time}, ਕਤਾਰ: #{queueNum}।',
    },
    GATE_CHECKIN: {
      hi: '[मंडीसिंक] गेट आगमन: टोकन #{tokenId} करनाल मंडी में सत्यापित। आपका कतार नंबर #{queueNum} सक्रिय है। कृपया पैवेलियन ए में प्रतीक्षा करें।',
      en: '[MandiSync] Gate Check-in: Token #{tokenId} verified at Mandi Gate. Active Queue #{queueNum}. Please wait in Pavilion A.',
      ta: '[மண்டிசின்க்] நுழைவு சரிபார்ப்பு: டோக்கன் #{tokenId} மண்டி வாயிலில் சரிபார்க்கப்பட்டது. வரிசை எண் #{queueNum}.',
      pb: '[ਮੰਡੀਸਿੰਕ] ਗੇਟ ਆਮਦ: ਟੋਕਨ #{tokenId} ਮੰਡੀ ਗੇਟ ਤੇ ਤਸਦੀਕ ਹੋਇਆ। ਕਤਾਰ ਨੰਬਰ #{queueNum} ਚਾਲੂ ਹੈ।',
    },
    QUEUE_CALLOUT: {
      hi: '[मंडीसिंक] काउंटर बुलावा: टोकन #{tokenId}! कृपया तौल व जांच हेतु काउंटर #{counterNum} पर तुरंत पहुंचें।',
      en: '[MandiSync] Counter Alert: Token #{tokenId}! Please report immediately to Counter #{counterNum} for weighment & testing.',
      ta: '[மண்டிசின்க்] அழைப்பு: டோக்கன் #{tokenId}! தயவுசெய்து கவுண்டர் #{counterNum}-க்கு உடனடியாக வரவும்.',
      pb: '[ਮੰਡੀਸਿੰਕ] ਕਾਊਂਟਰ ਸੱਦਾ: ਟੋਕਨ #{tokenId}! ਕਿਰਪਾ ਕਰਕੇ ਕਾਊਂਟਰ #{counterNum} ਤੇ ਤੁਰੰਤ ਪਹੁੰਚੋ।',
    },
    QUEUE_AUTOSWAP: {
      hi: '[मंडीसिंक] स्वतः-समायोजन: विलंब के कारण आपका टोकन #{tokenId} कतार स्थान #{newPos} पर अद्यतन किया गया है (कोई जुर्माना नहीं)। नया समय: {newTime}।',
      en: '[MandiSync] Auto-Swap Notice: Due to arrival delay, Token #{tokenId} updated to Queue Position #{newPos} without penalty. Rescheduled: {newTime}.',
      ta: '[மண்டிசின்க்] வரிசை மாற்றம்: டோக்கன் #{tokenId} புதிய வரிசை #{newPos}-க்கு மாற்றப்பட்டது. புதிய நேரம்: {newTime}.',
      pb: '[ਮੰਡੀਸਿੰਕ] ਸਵੈ-ਤਬਦੀਲੀ: ਦੇਰੀ ਕਾਰਨ ਟੋਕਨ #{tokenId} ਨੰਬਰ #{newPos} ਤੇ ਅੱਪਡੇਟ ਕੀਤਾ ਗਿਆ। ਸਮਾਂ: {newTime}।',
    },
    PAYMENT_DEPOSITED: {
      hi: '[मंडीसिंक] डीबीटी भुगतान: ₹{amount} आपके एसबीआई खाते ({account}) में सीधे जमा कर दिए गए हैं। UTR: {utr}। रसीद: {receiptNum}।',
      en: '[MandiSync] Direct Bank Transfer: ₹{amount} deposited directly into your bank A/C ({account}). UTR: {utr}. Receipt #{receiptNum}.',
      ta: '[மண்டிசின்க்] DBT பணம் செலுத்துதல்: ₹{amount} உங்கள் வங்கி கணக்கில் ({account}) நேரடியாக வரவு வைக்கப்பட்டது. UTR: {utr}.',
      pb: '[ਮੰਡੀਸਿੰਕ] DBT ਭੁਗਤਾਨ: ₹{amount} ਤੁਹਾਡੇ ਬੈਂਕ ਖਾਤੇ ({account}) ਵਿੱਚ ਜਮ੍ਹਾਂ ਕਰ ਦਿੱਤੇ ਗਏ ਹਨ। UTR: {utr}।',
    },
    QUALITY_RESULT: {
      hi: '[मंडीसिंक] गुणवता परीक्षण: टोकन #{tokenId} - ग्रेड {grade} प्रमाणित (नमी: {moisture}%)। खरीद प्रक्रिया स्वीकृत।',
      en: '[MandiSync] Quality Assay: Token #{tokenId} - Certified Grade {grade} (Moisture: {moisture}%). Procurement approved.',
      ta: '[மண்டிசின்க்] தர பரிசோதனை: டோக்கன் #{tokenId} - தரம் {grade} (ஈரப்பதம்: {moisture}%).',
      pb: '[ਮੰਡੀਸਿੰਕ] ਗੁਣਵੱਤਾ ਜਾਂਚ: ਟੋਕਨ #{tokenId} - ਗ੍ਰੇਡ {grade} ਪਾਸ (ਨਮੀ: {moisture}%)।',
    },
  };

  /**
   * Render template string with context variables
   */
  public renderTemplate(
    templateCode: keyof typeof this.templates,
    lang: SupportedLanguage = 'hi',
    vars: Record<string, string>
  ): string {
    const langTemplates = this.templates[templateCode] || this.templates.TOKEN_CONFIRMATION;
    let template = langTemplates[lang] || langTemplates.en || langTemplates.hi;

    Object.keys(vars).forEach((key) => {
      template = template.replace(new RegExp(`{${key}}`, 'g'), vars[key]);
    });

    return template;
  }

  /**
   * Send SMS / WhatsApp Notification & Log in DB
   */
  public async sendNotification(payload: TelephonyNotificationPayload) {
    const lang = payload.language || 'hi';
    const body = this.renderTemplate(payload.templateCode as any, lang, payload.variables);
    const messageId = `MSG-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Persist to database log
    const log = await prisma.telephonyMessageLog.create({
      data: {
        messageId,
        recipient: payload.recipient,
        channel: payload.channel || 'SMS',
        language: lang,
        templateCode: payload.templateCode,
        content: body,
        status: 'DELIVERED',
      },
    });

    // In production, integrate with Twilio / Exotel / Local SMS Gateway API here
    console.log(`[TELEPHONY ${payload.channel || 'SMS'} SENT] -> To: ${payload.recipient} | Content: ${body}`);

    return {
      success: true,
      messageId: log.messageId,
      renderedText: body,
      recipient: payload.recipient,
    };
  }
}

export const telephonyService = new TelephonyService();
