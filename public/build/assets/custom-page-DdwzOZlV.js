import{j as o}from"./ui-C9UzXxo-.js";import{K as N,d as v}from"./app-CePVSpCk.js";import w from"./Header-Bs-opqtr.js";import C from"./Footer-D4sYePYh.js";import{u as k}from"./use-favicon-BlwZF4jE.js";import"./vendor-CxtKjBZA.js";/* empty css            *//* empty css                  */import"./utils-2yqaTY3d.js";import"./menu-C113HrJq.js";import"./mail-wmSCdBQm.js";import"./phone-DUkL7MZF.js";import"./map-pin-CqHzBf39.js";import"./instagram-DJ274emi.js";import"./twitter-DvSPin83.js";function B(){var i,c,n,l,p,d,x,h,f,g,u,b,j;const y=`
    .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
      color: #1f2937;
      font-weight: 600;
      margin-top: 2rem;
      margin-bottom: 1rem;
    }
    
    .prose h1 { font-size: 2.25rem; }
    .prose h2 { font-size: 1.875rem; }
    .prose h3 { font-size: 1.5rem; }
    
    .prose p {
      margin-bottom: 1.5rem;
      line-height: 1.75;
    }
    
    .prose ul, .prose ol {
      margin: 1.5rem 0;
      padding-left: 1.5rem;
    }
    
    .prose li {
      margin-bottom: 0.5rem;
    }
    
    .prose a {
      color: var(--primary-color);
      text-decoration: underline;
    }
    
    .prose blockquote {
      border-left: 4px solid var(--primary-color);
      padding-left: 1rem;
      margin: 1.5rem 0;
      font-style: italic;
      background-color: #f9fafb;
      padding: 1rem;
    }
    
    .prose img {
      max-width: 100%;
      height: auto;
      border-radius: 0.5rem;
      margin: 1.5rem 0;
    }
  `,{page:t,customPages:_=[],settings:r}=N().props,a=((c=(i=r==null?void 0:r.config_sections)==null?void 0:i.theme)==null?void 0:c.primary_color)||"#3b82f6",m=((l=(n=r==null?void 0:r.config_sections)==null?void 0:n.theme)==null?void 0:l.secondary_color)||"#8b5cf6",s=((d=(p=r==null?void 0:r.config_sections)==null?void 0:p.theme)==null?void 0:d.accent_color)||"#10b981";return k(),o.jsxs(o.Fragment,{children:[o.jsxs(v,{title:t.meta_title||t.title,children:[t.meta_description&&o.jsx("meta",{name:"description",content:t.meta_description}),o.jsx("style",{children:y})]}),o.jsxs("div",{className:"min-h-screen bg-white",style:{"--primary-color":a,"--secondary-color":m,"--accent-color":s,"--primary-color-rgb":((x=a.replace("#","").match(/.{2}/g))==null?void 0:x.map(e=>parseInt(e,16)).join(", "))||"59, 130, 246","--secondary-color-rgb":((h=m.replace("#","").match(/.{2}/g))==null?void 0:h.map(e=>parseInt(e,16)).join(", "))||"139, 92, 246","--accent-color-rgb":((f=s.replace("#","").match(/.{2}/g))==null?void 0:f.map(e=>parseInt(e,16)).join(", "))||"16, 185, 129"},children:[o.jsx(w,{"max-w-7xl":!0,"mx-auto":!0,p:!0,settings:r,customPages:_,sectionData:((u=(g=r==null?void 0:r.config_sections)==null?void 0:g.sections)==null?void 0:u.find(e=>e.key==="header"))||{},brandColor:a}),o.jsx("main",{className:"pt-16",children:o.jsx("div",{className:"max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12",children:o.jsxs("div",{className:"max-w-4xl mx-auto",children:[o.jsxs("header",{className:"text-center mb-12",children:[o.jsx("h1",{className:"text-4xl font-bold text-gray-900 mb-4",children:t.title}),o.jsx("div",{className:"w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-600 mx-auto rounded-full"})]}),o.jsx("article",{className:"prose prose-lg max-w-none",children:o.jsx("div",{className:"text-gray-700 leading-relaxed",dangerouslySetInnerHTML:{__html:t.content}})})]})})}),o.jsx(C,{settings:r,sectionData:((j=(b=r==null?void 0:r.config_sections)==null?void 0:b.sections)==null?void 0:j.find(e=>e.key==="footer"))||{},brandColor:a})]})]})}export{B as default};
