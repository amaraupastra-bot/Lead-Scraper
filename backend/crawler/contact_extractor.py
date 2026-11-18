import re
import urllib.parse
from bs4 import BeautifulSoup
from typing import Dict, List, Set, Optional

EMAIL_REGEX = re.compile(
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b"
)

PHONE_REGEX = re.compile(
    r"(?:\+?1[-.\s]?)?\(?\b([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b"
)

# Filter out image filenames or template dummy emails
IGNORED_EMAIL_EXTENSIONS = (
    ".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".css", ".js"
)

IGNORED_DOMAINS = {
    "example.com", "domain.com", "email.com", "test.com", "wixpress.com",
    "sentry.io", "googleapis.com", "schema.org", "w3.org", "gravatar.com"
}

class ContactExtractor:
    @staticmethod
    def extract_from_html(
        html: str,
        base_url: str,
        current_page_url: str
    ) -> Dict[str, Any]:
        soup = BeautifulSoup(html, "html.parser")
        
        emails: Set[str] = set()
        phones: Set[str] = set()
        socials: Dict[str, str] = {
            "facebook": None,
            "instagram": None,
            "linkedin": None,
            "twitter": None
        }

        # 1. Check mailto: links (highest accuracy)
        for a_tag in soup.select('a[href^="mailto:"]'):
            href = a_tag.get("href", "")
            raw_email = href.replace("mailto:", "").split("?")[0].strip()
            if ContactExtractor._is_valid_email(raw_email):
                emails.add(raw_email.lower())

        # 2. Check tel: links
        for a_tag in soup.select('a[href^="tel:"]'):
            href = a_tag.get("href", "")
            raw_phone = href.replace("tel:", "").strip()
            clean_phone = ContactExtractor._format_phone(raw_phone)
            if clean_phone:
                phones.add(clean_phone)

        # 3. Check regular text regex for emails
        text_content = soup.get_text(separator=" ")
        for match in EMAIL_REGEX.findall(text_content):
            if ContactExtractor._is_valid_email(match):
                emails.add(match.lower())

        # 4. Check regular text regex for phones
        for match in PHONE_REGEX.findall(text_content):
            formatted = f"({match[0]}) {match[1]}-{match[2]}"
            phones.add(formatted)

        # 5. Extract social profile links
        for a_tag in soup.find_all("a", href=True):
            href = a_tag["href"]
            parsed = urllib.parse.urlparse(href)
            netloc = parsed.netloc.lower()

            if "facebook.com" in netloc and not socials["facebook"]:
                # Ignore share dialogs
                if "sharer" not in href and "share.php" not in href:
                    socials["facebook"] = href
            elif "instagram.com" in netloc and not socials["instagram"]:
                socials["instagram"] = href
            elif "linkedin.com" in netloc and not socials["linkedin"]:
                if "company" in href or "in/" in href:
                    socials["linkedin"] = href
            elif ("twitter.com" in netloc or "x.com" in netloc) and not socials["twitter"]:
                if "intent" not in href and "share" not in href:
                    socials["twitter"] = href

        # Return primary, secondary (dual email) and all structured contacts
        email_list = list(emails)
        primary_email = email_list[0] if len(email_list) > 0 else None
        secondary_email = email_list[1] if len(email_list) > 1 else None
        primary_phone = next(iter(phones), None)

        structured_contacts = []
        for em in emails:
            structured_contacts.append({
                "type": "email",
                "value": em,
                "source_url": current_page_url,
                "verification_status": "Verified" if "mailto:" in html else "Extracted"
            })
        for ph in phones:
            structured_contacts.append({
                "type": "phone",
                "value": ph,
                "source_url": current_page_url,
                "verification_status": "Extracted"
            })
        for soc_type, soc_url in socials.items():
            if soc_url:
                structured_contacts.append({
                    "type": soc_type,
                    "value": soc_url,
                    "source_url": current_page_url,
                    "verification_status": "Extracted"
                })

        return {
            "primary_email": primary_email,
            "secondary_email": secondary_email,
            "primary_phone": primary_phone,
            "socials": socials,
            "all_contacts": structured_contacts,
        }

    @staticmethod
    def _is_valid_email(email: str) -> bool:
        if not email or "@" not in email:
            return False
        email = email.lower().strip()
        if any(email.endswith(ext) for ext in IGNORED_EMAIL_EXTENSIONS):
            return False
        domain = email.split("@")[-1]
        if domain in IGNORED_DOMAINS:
            return False
        if len(email) > 80 or len(email) < 6:
            return False
        return True

    @staticmethod
    def _format_phone(raw: str) -> Optional[str]:
        digits = re.sub(r"\D", "", raw)
        if len(digits) == 10:
            return f"({digits[:3]}) {digits[3:6]}-{digits[6:]}"
        elif len(digits) == 11 and digits.startswith("1"):
            return f"({digits[1:4]}) {digits[4:7]}-{digits[7:]}"
        elif len(digits) >= 7:
            return raw.strip()
        return None
