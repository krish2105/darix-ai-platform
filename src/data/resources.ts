export interface ResourceSection {
  heading: string;
  body: string[];
}

export interface Resource {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTimeMinutes: number;
  publishedAt: string;
  sections: ResourceSection[];
  // Optional Arabic long-form content. English is the source of truth and
  // stays the fallback when these aren't set — most resources are
  // English-only by scope decision (see DEPLOYMENT.md); the two
  // UAE-specific articles most likely to be shared by an Arabic-speaking
  // decision maker (PDPL, AI readiness) are translated in full.
  titleAr?: string;
  excerptAr?: string;
  sectionsAr?: ResourceSection[];
}

/** Picks the Arabic content when present and locale is 'ar', otherwise English. */
export const localizeResource = (resource: Resource, locale: 'en' | 'ar') => {
  if (locale === 'ar' && resource.titleAr && resource.excerptAr && resource.sectionsAr) {
    return { title: resource.titleAr, excerpt: resource.excerptAr, sections: resource.sectionsAr };
  }
  return { title: resource.title, excerpt: resource.excerpt, sections: resource.sections };
};

export const resources: Resource[] = [
  {
    slug: 'ai-readiness-checklist-uae',
    title: 'Is Your UAE Business Actually Ready for AI? A Practical Checklist',
    excerpt:
      'Most AI initiatives stall not because the technology fails, but because the organization wasn’t ready for it. Here’s what "ready" actually looks like.',
    category: 'AI Strategy',
    readTimeMinutes: 6,
    publishedAt: '2026-05-04',
    sections: [
      {
        heading: 'Readiness is an organizational question, not a technical one',
        body: [
          'Every AI vendor pitch starts with the model. Almost none of them start with the question that actually determines whether the project survives contact with your business: is the organization structured to use this?',
          'A retail chain can license the same recommendation engine as a competitor and get wildly different results, because one team has clean, unified customer data and clear ownership of the customer experience, and the other has three disconnected point-of-sale systems and no one accountable for acting on the output.',
        ],
      },
      {
        heading: 'The four gaps that kill AI projects before they start',
        body: [
          'Data fragmentation. If customer, operations, or financial data lives in five different tools that don’t talk to each other, any AI system built on top inherits that fragmentation. Consolidation work — unglamorous, but necessary — usually has to happen first.',
          'No process owner. AI recommendations only create value if someone with the authority to act on them actually does. Pilots frequently produce a working dashboard that nobody is responsible for using.',
          'Underestimated governance load. Deploying AI that touches customer data, hiring decisions, or credit/lending decisions in the UAE means thinking through PDPL obligations, explainability, and human review from day one, not retrofitting them after a regulator asks.',
          'Skills gap without a plan to close it. Buying a tool doesn’t create the internal capability to configure, monitor, and improve it. Most SMEs underinvest in the training and process redesign that make a tool stick.',
        ],
      },
      {
        heading: 'What a realistic first 90 days looks like',
        body: [
          'Start narrower than feels ambitious: one workflow, one team, one measurable outcome. Fix the data feeding that workflow before automating around it. Assign a single owner who is measured on the outcome, not just the deployment. Build the PDPL and human-review checkpoints in from the start rather than as an afterthought.',
          'Organizations that follow roughly this sequence tend to reach a usable, defensible AI deployment in one quarter. Organizations that skip straight to "buy the tool" tend to have an expensive pilot that never gets adopted.',
        ],
      },
      {
        heading: 'How to find out where you actually stand',
        body: [
          'The gaps above are common, but which ones apply to your organization — and how severely — varies a lot by sector, size, and current tooling. That’s the specific question the Darix AI Readiness Assessment is built to answer: a structured score across strategy, data maturity, automation potential, governance, and team readiness, with a roadmap tied to your actual gaps rather than a generic one.',
        ],
      },
    ],
    titleAr: 'هل شركتك في الإمارات جاهزة فعلاً للذكاء الاصطناعي؟ قائمة تحقق عملية',
    excerptAr:
      'معظم مبادرات الذكاء الاصطناعي تتعثر ليس لأن التقنية تفشل، بل لأن المؤسسة لم تكن جاهزة لها. إليك كيف تبدو "الجاهزية" فعلياً.',
    sectionsAr: [
      {
        heading: 'الجاهزية سؤال تنظيمي، لا سؤال تقني',
        body: [
          'كل عرض تقديمي من مزوّد ذكاء اصطناعي يبدأ بالنموذج. لا يكاد أي منها يبدأ بالسؤال الذي يحدد فعلياً ما إذا كان المشروع سينجو بعد ملامسة واقع عملك: هل المؤسسة منظَّمة لاستخدام هذا النظام؟',
          'يمكن لسلسلة متاجر تجزئة أن ترخّص محرك التوصيات نفسه الذي تستخدمه منافِسة لها وتحصل على نتائج مختلفة تماماً، لأن أحد الفريقين يملك بيانات عملاء نظيفة وموحّدة وملكية واضحة لتجربة العميل، بينما يملك الآخر ثلاثة أنظمة نقاط بيع منفصلة لا تتواصل مع بعضها، ولا أحد مسؤول عن التصرف بناءً على المخرجات.',
        ],
      },
      {
        heading: 'الفجوات الأربع التي تقتل مشاريع الذكاء الاصطناعي قبل أن تبدأ',
        body: [
          'تشتت البيانات. إذا كانت بيانات العملاء أو العمليات أو البيانات المالية موزعة على خمس أدوات مختلفة لا تتواصل فيما بينها، فإن أي نظام ذكاء اصطناعي يُبنى فوقها يرث هذا التشتت. عمل التوحيد — غير الجذّاب لكنه ضروري — عادةً ما يجب أن يحدث أولاً.',
          'غياب مالك للعملية. توصيات الذكاء الاصطناعي لا تخلق قيمة إلا إذا تصرّف بناءً عليها شخص يملك الصلاحية لذلك فعلياً. غالباً ما تُنتج المشاريع التجريبية لوحة تحكم تعمل جيداً لكن لا أحد مسؤول عن استخدامها.',
          'التقليل من عبء الحوكمة. نشر ذكاء اصطناعي يتعامل مع بيانات العملاء أو قرارات التوظيف أو قرارات الائتمان/الإقراض في الإمارات يعني التفكير في التزامات قانون حماية البيانات الشخصية (PDPL) وقابلية التفسير والمراجعة البشرية منذ اليوم الأول، لا إضافتها لاحقاً بعد أن تسأل جهة تنظيمية.',
          'فجوة المهارات دون خطة لسدّها. شراء أداة لا يخلق القدرة الداخلية على ضبطها ومراقبتها وتحسينها. تستثمر معظم الشركات الصغيرة والمتوسطة أقل مما يجب في التدريب وإعادة تصميم العمليات التي تجعل الأداة تستمر.',
        ],
      },
      {
        heading: 'كيف تبدو أول 90 يوماً واقعية',
        body: [
          'ابدأ بنطاق أضيق مما يبدو طموحاً: سير عمل واحد، فريق واحد، نتيجة واحدة قابلة للقياس. أصلح البيانات التي تغذّي ذلك السير قبل أتمتته. عيّن مالكاً واحداً يُقاس أداؤه بالنتيجة لا بمجرد إطلاق النظام. ابنِ نقاط تحقق قانون حماية البيانات والمراجعة البشرية منذ البداية لا كفكرة لاحقة.',
          'المؤسسات التي تتبع هذا التسلسل تقريباً تميل إلى الوصول إلى نشر ذكاء اصطناعي قابل للاستخدام والدفاع عنه خلال ربع سنة واحد. أما المؤسسات التي تقفز مباشرة إلى "شراء الأداة" فتنتهي غالباً بمشروع تجريبي مكلف لا يُعتمد أبداً.',
        ],
      },
      {
        heading: 'كيف تعرف أين تقف فعلياً',
        body: [
          'الفجوات أعلاه شائعة، لكن أيّها ينطبق على مؤسستك — وبأي درجة من الخطورة — يختلف كثيراً حسب القطاع والحجم والأدوات الحالية. هذا هو السؤال المحدد الذي بُني تقييم Darix لجاهزية الذكاء الاصطناعي للإجابة عليه: درجة منظَّمة عبر الاستراتيجية ونضج البيانات وإمكانات الأتمتة والحوكمة وجاهزية الفريق، مع خارطة طريق مرتبطة بفجواتك الفعلية لا بخارطة طريق عامة.',
        ],
      },
    ],
  },
  {
    slug: 'pdpl-and-ai-what-uae-businesses-need-to-know',
    title: 'UAE PDPL and AI: What to Check Before You Deploy',
    excerpt:
      'Federal Decree-Law No. 45 of 2021 applies to any AI system that touches personal data — which is most of them. Here’s the practical checklist, not the legal theory.',
    category: 'Compliance',
    readTimeMinutes: 7,
    publishedAt: '2026-05-18',
    sections: [
      {
        heading: 'PDPL applies the moment personal data is involved',
        body: [
          'The UAE Personal Data Protection Law (Federal Decree-Law No. 45 of 2021) governs the collection, processing, and storage of personal data by businesses operating in the UAE. An AI system that scores leads, recommends products, screens CVs, or personalizes a customer experience is processing personal data — which means it’s in scope, regardless of whether the AI vendor is based in the UAE or not.',
          'This isn’t a reason to avoid AI. It’s a reason to build the compliance work into the deployment plan instead of bolting it on after a customer complaint or a regulator inquiry.',
        ],
      },
      {
        heading: 'The practical checklist before you go live',
        body: [
          'Legal basis: know which basis you’re relying on for each use of personal data in the AI system — consent, contract performance, or legitimate interest — and be able to explain it if asked.',
          'Data minimization: check whether the AI tool actually needs every field it’s been given. Vendors often default to ingesting more than the use case requires.',
          'Cross-border transfer: many AI tools process data on servers outside the UAE. PDPL has specific requirements for transferring personal data outside the country — this needs a real review, not an assumption that "the vendor is compliant" covers you.',
          'Data subject rights: your business needs a working process for someone to request access to, correction of, or deletion of their data — including data that fed into or was generated by an AI system. A privacy policy that promises this without an actual mechanism behind it is a liability, not a safeguard.',
          'Human oversight: for any AI-assisted decision that meaningfully affects a person (credit, hiring, pricing), have a defined process for human review, not just automated output going straight to action.',
        ],
      },
      {
        heading: 'Where this fits into an AI rollout timeline',
        body: [
          'The mistake we see most often: PDPL review happens after the AI tool is already selected and half-deployed, which turns it into a blocker instead of a design input. Reviewing data flows, transfer arrangements, and rights processes during vendor selection is significantly cheaper than doing it after go-live.',
        ],
      },
      {
        heading: 'A note on this article',
        body: [
          'This is a starting checklist, not legal advice — a UAE-qualified lawyer should review your specific data flows and vendor contracts before you rely on any of it. Darix AI’s own Privacy Policy and Privacy Center are built against this same PDPL framework; see the Privacy Center for how we handle access and erasure requests in practice.',
        ],
      },
    ],
    titleAr: 'قانون حماية البيانات الشخصية الإماراتي والذكاء الاصطناعي: ما يجب التحقق منه قبل النشر',
    excerptAr:
      'ينطبق المرسوم بقانون اتحادي رقم 45 لسنة 2021 على أي نظام ذكاء اصطناعي يتعامل مع بيانات شخصية — وهو ما ينطبق على معظمها. إليك القائمة العملية، لا النظرية القانونية.',
    sectionsAr: [
      {
        heading: 'قانون حماية البيانات الشخصية ينطبق بمجرد التعامل مع بيانات شخصية',
        body: [
          'يحكم قانون حماية البيانات الشخصية الإماراتي (المرسوم بقانون اتحادي رقم 45 لسنة 2021) جمع ومعالجة وتخزين البيانات الشخصية من قبل الشركات العاملة في دولة الإمارات. أي نظام ذكاء اصطناعي يُقيّم العملاء المحتملين، أو يوصي بمنتجات، أو يفرز السير الذاتية، أو يخصّص تجربة العميل، فهو يعالج بيانات شخصية — ما يعني أنه يقع ضمن نطاق القانون، بصرف النظر عمّا إذا كان مزوّد الذكاء الاصطناعي مقراً في الإمارات أم لا.',
          'هذا ليس سبباً لتجنّب الذكاء الاصطناعي، بل سبب لإدماج عمل الامتثال في خطة النشر بدلاً من إضافته لاحقاً بعد شكوى من عميل أو استفسار من جهة تنظيمية.',
        ],
      },
      {
        heading: 'القائمة العملية قبل الإطلاق الفعلي',
        body: [
          'الأساس القانوني: اعرف الأساس الذي تعتمد عليه لكل استخدام للبيانات الشخصية في نظام الذكاء الاصطناعي — الموافقة، أو تنفيذ العقد، أو المصلحة المشروعة — وكن قادراً على تفسيره إذا سُئلت.',
          'تقليل البيانات: تحقق مما إذا كانت أداة الذكاء الاصطناعي تحتاج فعلياً إلى كل حقل بيانات أُتيح لها. غالباً ما يستوعب المزوّدون بيانات أكثر مما تتطلبه حالة الاستخدام بشكل افتراضي.',
          'النقل عبر الحدود: تعالج كثير من أدوات الذكاء الاصطناعي البيانات على خوادم خارج الإمارات. لقانون حماية البيانات الشخصية متطلبات محددة لنقل البيانات الشخصية خارج الدولة — وهذا يستوجب مراجعة حقيقية، لا افتراض أن "امتثال المزوّد" يغطيك.',
          'حقوق أصحاب البيانات: تحتاج مؤسستك إلى آلية عملية تتيح لأي شخص طلب الوصول إلى بياناته أو تصحيحها أو حذفها — بما في ذلك البيانات التي غذّت نظام الذكاء الاصطناعي أو تولّدت عنه. سياسة خصوصية تَعِد بذلك دون آلية فعلية خلفها هي مسؤولية قانونية لا ضمانة.',
          'المراجعة البشرية: لأي قرار بمساعدة الذكاء الاصطناعي يؤثر بشكل جوهري على شخص (الائتمان، التوظيف، التسعير)، ضع عملية محددة للمراجعة البشرية، لا مجرد مخرجات آلية تنتقل مباشرة إلى التنفيذ.',
        ],
      },
      {
        heading: 'أين يقع هذا في الجدول الزمني لطرح الذكاء الاصطناعي',
        body: [
          'الخطأ الذي نراه غالباً: تحدث مراجعة قانون حماية البيانات بعد أن يكون تم اختيار أداة الذكاء الاصطناعي بالفعل ونشرها جزئياً، ما يحوّلها من مدخل تصميمي إلى عائق. مراجعة تدفقات البيانات وترتيبات النقل وعمليات الحقوق أثناء اختيار المزوّد أقل تكلفة بكثير من القيام بذلك بعد الإطلاق الفعلي.',
        ],
      },
      {
        heading: 'ملاحظة حول هذا المقال',
        body: [
          'هذه قائمة تحقق أولية لا استشارة قانونية — يجب أن يراجع محامٍ مؤهل في الإمارات تدفقات بياناتك وعقود مزوّديك تحديداً قبل الاعتماد على أي مما ورد هنا. تُبنى سياسة الخصوصية ومركز الخصوصية الخاصان بـ Darix AI على إطار قانون حماية البيانات الشخصية نفسه؛ راجع مركز الخصوصية لمعرفة كيفية تعاملنا مع طلبات الوصول والحذف عملياً.',
        ],
      },
    ],
  },
  {
    slug: 'calculating-real-roi-on-ai-initiatives',
    title: 'Beyond the Hype: Calculating Real ROI on AI Initiatives',
    excerpt:
      '"AI will transform your business" is not a budget line. Here’s how to build a defensible ROI case before you commit spend.',
    category: 'Business Value',
    readTimeMinutes: 5,
    publishedAt: '2026-06-02',
    sections: [
      {
        heading: 'Why so many AI budgets get cut after year one',
        body: [
          'The most common failure pattern isn’t that the AI didn’t work — it’s that no one defined what "working" meant in terms the finance team would recognize before the project started. A chatbot that "improves customer experience" is hard to defend in a budget review. A chatbot that reduces average handling time by a measured amount, tied to a headcount or overtime line, is not.',
        ],
      },
      {
        heading: 'Three ROI categories that actually hold up',
        body: [
          'Time reclaimed: hours saved on a specific, currently-manual workflow (reporting, data entry, follow-up scheduling), multiplied by the fully-loaded cost of the people doing it today.',
          'Conversion or retention lift: a measurable change in a funnel metric you already track — lead-to-close rate, repeat purchase rate, response time to inquiry — attributable to the AI system, ideally validated with a before/after or holdout comparison.',
          'Risk or error reduction: fewer compliance exceptions, fewer manual-entry errors, faster detection of anomalies — valued at what those errors currently cost when they happen.',
        ],
      },
      {
        heading: 'Build the baseline before you build the AI',
        body: [
          'You cannot prove a lift you didn’t measure the starting point for. Before deploying, capture the current numbers for the metric the AI is meant to move — current handling time, current conversion rate, current error rate — over a representative period, not just a good week.',
          'This baseline step is the one organizations skip most often under time pressure, and it’s the one that determines whether the project can defend its budget at renewal time.',
        ],
      },
      {
        heading: 'Tie ROI tracking to your readiness gaps',
        body: [
          'The AI initiatives with the clearest ROI tend to be the ones targeted at a specific, already-measured bottleneck — which is exactly what a structured readiness assessment surfaces. Rather than starting from "what can AI do for us," start from "what is our most expensive manual bottleneck, and is the data behind it clean enough to automate against."',
        ],
      },
    ],
  },
];

export const getResourceBySlug = (slug: string) => resources.find((r) => r.slug === slug);
