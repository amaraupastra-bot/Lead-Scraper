import re
from bs4 import BeautifulSoup
from typing import Dict, List, Any
from datetime import datetime

class QualityAnalyzer:
    """
    Analyzes website HTML and load performance to compute the 
    Website Improvement Opportunity Score (0 - 100).
    Higher score = More agency redesign and development opportunity!
    """

    @staticmethod
    def analyze_site(
        html: str,
        url: str,
        load_time_ms: int,
        status_code: int,
        is_https: bool,
    ) -> Dict[str, Any]:
        soup = BeautifulSoup(html, "html.parser")
        
        detected_issues: List[str] = []
        recommendations: List[str] = []
        technologies_detected: List[str] = []

        # Category scores (0 = perfect, 100 = critical problems)
        perf_deduction = 0
        mobile_deduction = 0
        design_deduction = 0
        links_deduction = 0
        nav_deduction = 0
        seo_deduction = 0
        tech_deduction = 0

        # --- 1. Technical & Security (10 points) ---
        if not is_https or url.startswith("http://"):
            tech_deduction += 7
            detected_issues.append("Missing SSL / Non-HTTPS connection (Not Secure)")
            recommendations.append("Install an SSL certificate to ensure security and prevent Google browser warnings.")

        if status_code >= 400:
            tech_deduction += 10
            detected_issues.append(f"HTTP Server Error (Status code: {status_code})")
            recommendations.append("Fix server errors or configuration issues affecting availability.")

        # --- 2. Performance (20 points) ---
        if load_time_ms > 4000:
            perf_deduction += 20
            detected_issues.append(f"Severely slow loading speed ({load_time_ms / 1000:.1f}s)")
            recommendations.append("Optimize image assets, enable compression, and upgrade hosting infrastructure.")
        elif load_time_ms > 2500:
            perf_deduction += 12
            detected_issues.append(f"Slow page loading time ({load_time_ms / 1000:.1f}s)")
            recommendations.append("Improve First Contentful Paint by minifying CSS/JS and caching assets.")
        elif load_time_ms > 1500:
            perf_deduction += 6
            detected_issues.append("Sub-optimal page response speed")

        # --- 3. Mobile Responsiveness (20 points) ---
        viewport = soup.find("meta", attrs={"name": re.compile(r"^viewport$", re.I)})
        mobile_status = "Responsive"
        if not viewport:
            mobile_deduction += 20
            mobile_status = "Non-Responsive"
            detected_issues.append("Missing mobile viewport meta tag (Horizontally broken on phones)")
            recommendations.append("Implement modern responsive mobile-first CSS architecture.")
        else:
            # Check content of viewport
            content = viewport.get("content", "")
            if "width=device-width" not in content:
                mobile_deduction += 12
                mobile_status = "Partially Responsive"
                detected_issues.append("Improper mobile viewport configuration")
                recommendations.append("Add 'width=device-width, initial-scale=1.0' to viewport meta tag.")

        # --- 4. Design & Age Indicators (20 points) ---
        # A. Deprecated legacy tags
        deprecated_tags = soup.find_all(["font", "center", "marquee", "blink", "frameset", "frame"])
        if deprecated_tags:
            design_deduction += 8
            detected_issues.append(f"Contains obsolete HTML markup (<{deprecated_tags[0].name}> tags from early 2000s)")
            recommendations.append("Modernize HTML codebase to current HTML5 standards.")

        # B. Flash / Silverlight embeds
        flash_embeds = soup.find_all(["embed", "object"])
        for em in flash_embeds:
            if "flash" in str(em).lower():
                design_deduction += 12
                detected_issues.append("Outdated Flash/deprecated media components detected")
                recommendations.append("Replace legacy plugin embeds with modern HTML5 video and CSS animations.")
                break

        # C. Outdated copyright year in footer
        text = soup.get_text()
        current_year = 2026
        copyright_matches = re.findall(r"(?:©|copyright|&copy;)\s*(?:20\d{2}\s*-\s*)?(20\d{2})", text, re.IGNORECASE)
        if copyright_matches:
            try:
                found_year = int(copyright_matches[-1])
                if found_year < current_year - 4:
                    design_deduction += 10
                    detected_issues.append(f"Outdated copyright notice ({found_year}) indicates neglected website")
                    recommendations.append("Complete visual redesign to reflect an active, modern business.")
            except ValueError:
                pass

        # D. Table based layout detection
        tables = soup.find_all("table")
        if len(tables) > 3 and not soup.find_all(["section", "main", "article"]):
            design_deduction += 8
            detected_issues.append("Appears to use archaic table-based layout instead of modern CSS Grid/Flexbox")
            recommendations.append("Rebuild layout using responsive CSS Flexbox and modern component structure.")

        # --- 5. SEO Basics (10 points) ---
        title = soup.find("title")
        if not title or not title.get_text(strip=True):
            seo_deduction += 5
            detected_issues.append("Missing page title tag")
            recommendations.append("Add a targeted, keyword-optimized page title tag.")
        elif len(title.get_text(strip=True)) < 10:
            seo_deduction += 3
            detected_issues.append("Page title is too short and uninformative")

        meta_desc = soup.find("meta", attrs={"name": re.compile(r"^description$", re.I)})
        if not meta_desc or not meta_desc.get("content", "").strip():
            seo_deduction += 5
            detected_issues.append("Missing meta description tag for search engine indexing")
            recommendations.append("Provide engaging meta descriptions for search engine snippets.")

        # --- 6. Navigation and Usability (10 points) ---
        nav = soup.find("nav")
        if not nav and not soup.find(id=re.compile(r"nav|menu|header", re.I)):
            nav_deduction += 6
            detected_issues.append("No standard navigation landmarks detected")
            recommendations.append("Add clear, accessible navigation bar with mobile hamburger menu.")

        # Check for contact form
        forms = soup.find_all("form")
        if not forms:
            nav_deduction += 4
            detected_issues.append("No interactive contact or quote inquiry form found on page")
            recommendations.append("Add an interactive lead capture form with instant email alerts.")

        # --- 7. Images & Broken Link Indicators (10 points) ---
        images = soup.find_all("img")
        missing_alt = sum(1 for img in images if not img.get("alt"))
        if images and missing_alt > len(images) * 0.5:
            links_deduction += 5
            detected_issues.append(f"{missing_alt} images missing accessibility alt attributes")
            recommendations.append("Add descriptive alt tags to all images for WCAG accessibility and image SEO.")

        # Detect technologies
        scripts = soup.find_all("script", src=True)
        for s in scripts:
            src = s["src"].lower()
            if "wp-content" in src or "wordpress" in src:
                technologies_detected.append("WordPress")
            elif "wix.com" in src or "wixpress" in src:
                technologies_detected.append("Wix")
            elif "squarespace" in src:
                technologies_detected.append("Squarespace")
            elif "shopify" in src:
                technologies_detected.append("Shopify")
            elif "jquery/1." in src or "jquery-1." in src:
                technologies_detected.append("Legacy jQuery 1.x (Outdated)")
                design_deduction += 4
                detected_issues.append("Uses obsolete jQuery 1.x library with known security vulnerabilities")

        technologies_detected = list(set(technologies_detected))
        if not technologies_detected:
            technologies_detected.append("Custom / Plain HTML")

        # Clamp deductions to their maximum allowed points
        perf_score = min(20, perf_deduction)
        mobile_score = min(20, mobile_deduction)
        design_score = min(20, design_deduction)
        links_score = min(10, links_deduction)
        nav_score = min(10, nav_deduction)
        seo_score = min(10, seo_deduction)
        tech_score = min(10, tech_deduction)

        # Improvement Opportunity Score (0 to 100, higher = more work needed)
        total_improvement_score = (
            perf_score +
            mobile_score +
            design_score +
            links_score +
            nav_score +
            seo_score +
            tech_score
        )

        # Standard lighthouse-style performance subscores (out of 100 where 100 = best)
        perf_lighthouse = max(10, 100 - (perf_score * 5))
        accessibility_score = max(15, 100 - ((links_score + nav_score) * 5))
        seo_lighthouse = max(20, 100 - (seo_score * 10))

        if not recommendations:
            recommendations.append("Maintain routine performance audits and mobile responsiveness checks.")

        return {
            "improvement_score": total_improvement_score,
            "performance_score": perf_lighthouse,
            "accessibility_score": accessibility_score,
            "seo_score": seo_lighthouse,
            "mobile_status": mobile_status,
            "broken_links": 0,
            "load_time_ms": load_time_ms,
            "has_https": is_https,
            "detected_issues": detected_issues,
            "recommendations": recommendations,
            "technologies_detected": technologies_detected,
        }
