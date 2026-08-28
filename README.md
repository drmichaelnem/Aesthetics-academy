# Aesthetics Academy - בוט תשובות אוטומטיות

שרת שמקבל הודעות מאינסטגרם ומוואטסאפ ועונה אוטומטית לפי מילות מפתח.

## איך לערוך את התשובות

פתחו את הקובץ `replies.json`. לכל כלל יש:
- `keywords` - רשימת מילים/ביטויים שאם מופיעים בהודעה, מפעילים את הכלל
- `reply` - הטקסט שיישלח בתגובה

`defaultReply` היא התשובה שנשלחת כשאין התאמה לאף כלל. אפשר לשנות את זה לכל טקסט, או להשאיר ריק (`""`) כדי שלא תישלח תשובה כלל במקרה כזה.

**אין צורך לגעת בקוד** - רק לערוך את קובץ ה-JSON הזה ולשמור.

## הרצה מקומית

```
npm install
cp .env.example .env
# מלאו את הטוקנים ב-.env
npm start
```

## משתני סביבה נדרשים

| משתנה | מה זה |
|---|---|
| `IG_VERIFY_TOKEN` | מחרוזת אקראית שאתם בוחרים, תוזן גם בהגדרות ה-Webhook באתר מטא |
| `IG_PAGE_ACCESS_TOKEN` | הטוקן שנוצר בשלב "Generate access tokens" באפליקציית מטא |
| `WA_VERIFY_TOKEN` | מחרוזת אקראית שאתם בוחרים, לוואטסאפ |
| `WA_ACCESS_TOKEN` | טוקן הגישה לוואטסאפ Business Platform |
| `WA_PHONE_NUMBER_ID` | מזהה מספר הטלפון העסקי בוואטסאפ |

## פריסה (Deployment)

הפרויקט מוכן לפריסה על Render כ-Web Service:
1. חבר את הריפו ב-Render
2. Build command: `npm install`
3. Start command: `npm start`
4. הוסף את משתני הסביבה למעלה בהגדרות ה-Environment של השירות
5. אחרי הפריסה תקבלו כתובת (למשל `https://your-app.onrender.com`) - זו תהיה כתובת ה-Callback URL שתזינו באתר מטא:
   - אינסטגרם: `https://your-app.onrender.com/webhook/instagram`
   - וואטסאפ: `https://your-app.onrender.com/webhook/whatsapp`
