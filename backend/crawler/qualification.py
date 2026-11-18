from typing import Dict, List, Any, Tuple

class LeadQualifier:
    @staticmethod
    def qualify_lead(
        has_website: bool,
        website_score: int,  # 0 - 100 improvement opportunity score
        has_email: bool,
        has_phone: bool,
        has_socials: bool,
        detected_issues: List[str]
    ) -> Tuple[str, List[str]]:
        """
        Calculates Lead Priority: 'High Priority', 'Medium Priority', or 'Low Priority'
        and provides transparent qualification reasons.
        """
        reasons = []

        # Case 1: Business has NO website (Highest agency conversion opportunity)
        if not has_website:
            reasons.append("Prime agency prospect: Registered business is operating with no active website.")
            if has_email:
                reasons.append("Direct verified email available for outbound proposal.")
            if has_phone:
                reasons.append("Direct phone contact available for immediate call.")
            return "High Priority", reasons

        # Case 2: Business has website - evaluate based on flaws and reachable contact channels
        # If website score >= 40 (meaning serious defects: slow, non-responsive, outdated design, no HTTPS)
        if website_score >= 45:
            reasons.append(f"Substantial website improvement opportunity (Defect Score: {website_score}/100)")
            for issue in detected_issues[:3]:
                reasons.append(f"Key issue: {issue}")
            
            if has_email and has_phone:
                reasons.append("Multi-channel contact ready (Email and Phone found)")
                return "High Priority", reasons
            elif has_email or has_phone:
                reasons.append("Direct outreach channel available")
                return "High Priority", reasons
            else:
                reasons.append("High redesign need, but public direct email/phone not found")
                return "Medium Priority", reasons

        elif website_score >= 25:
            reasons.append(f"Moderate website improvement potential (Defect Score: {website_score}/100)")
            if detected_issues:
                reasons.append(f"Noticeable issue: {detected_issues[0]}")
            if has_email or has_phone:
                reasons.append("Direct contact channel available")
                return "Medium Priority", reasons
            else:
                return "Low Priority", reasons

        else:
            reasons.append("Website is modern, fast, and relatively well-maintained")
            if has_email:
                reasons.append("Contact available, but redesign urgency is low")
            return "Low Priority", reasons
