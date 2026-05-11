RISK_RECOMMENDATIONS = {
    "low": {
        "en": [
            "Maintain routine hygiene and vaccination schedules.",
            "Continue weekly monitoring of local case reports.",
            "Keep high-risk patients informed about early symptoms.",
        ],
        "ar": [
            "الحفاظ على النظافة الدورية وجداول التطعيم.",
            "متابعة تقارير الحالات المحلية أسبوعيا.",
            "توعية الفئات عالية الخطورة بالأعراض المبكرة.",
        ],
    },
    "medium": {
        "en": [
            "Increase screening in clinics and schools.",
            "Prepare basic isolation and triage capacity.",
            "Review weather-sensitive prevention messages.",
        ],
        "ar": [
            "زيادة الفحص في العيادات والمدارس.",
            "تجهيز قدرة أساسية للعزل والفرز.",
            "مراجعة رسائل الوقاية المرتبطة بالطقس.",
        ],
    },
    "high": {
        "en": [
            "Activate targeted public health alerts.",
            "Stock essential medicines and protective supplies.",
            "Prioritize testing for symptomatic and vulnerable groups.",
        ],
        "ar": [
            "تفعيل تنبيهات صحية موجهة للجمهور.",
            "توفير الأدوية الأساسية ومستلزمات الوقاية.",
            "إعطاء أولوية للفحص للمصابين بالأعراض والفئات الضعيفة.",
        ],
    },
    "critical": {
        "en": [
            "Open emergency response coordination with hospitals.",
            "Start daily surveillance and rapid case reporting.",
            "Deploy community outreach and urgent prevention campaigns.",
        ],
        "ar": [
            "فتح تنسيق الاستجابة الطارئة مع المستشفيات.",
            "بدء الترصد اليومي والإبلاغ السريع عن الحالات.",
            "تنفيذ حملات توعية ووقاية عاجلة في المجتمع.",
        ],
    },
}


def build_recommendations(risk_level: str, disease_type: str | None, features: dict) -> dict[str, list[str]]:
    key = risk_level.lower()
    recommendations = RISK_RECOMMENDATIONS.get(key, RISK_RECOMMENDATIONS["medium"]).copy()

    disease = (disease_type or "").strip()
    weather = str(features.get("weather") or features.get("Weather") or "").lower()

    if disease:
        recommendations["en"] = [
            f"Track confirmed {disease} cases by district and age group.",
            *recommendations["en"],
        ]
        recommendations["ar"] = [
            f"متابعة حالات {disease} المؤكدة حسب المنطقة والفئة العمرية.",
            *recommendations["ar"],
        ]

    if "rain" in weather or "humid" in weather:
        recommendations["en"].append("Inspect water accumulation areas and reinforce vector control.")
        recommendations["ar"].append("فحص أماكن تجمع المياه وتعزيز مكافحة النواقل.")

    if "hot" in weather or "heat" in weather:
        recommendations["en"].append("Prepare heat-aware guidance for elderly and chronic disease patients.")
        recommendations["ar"].append("تجهيز إرشادات خاصة بالحرارة لكبار السن ومرضى الأمراض المزمنة.")

    return recommendations
