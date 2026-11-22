/** Watch Heaven design tokens copied from the Stitch design. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,json,html}'],
  theme: {
    extend: {
      colors: {
        'warm-bone':'#F3EFE6','deep-ink':'#141311','aged-brass':'#A8823A',
        'aged-brass-text':'#7D5E22','hairline':'#D9D2C3',
        'primary':'#141311','on-primary':'#F3EFE6','surface':'#F3EFE6',
        'on-surface':'#141311','surface-alt':'#EAE4D7','on-surface-alt':'#141311',
        'surface-input':'#FFFFFF','on-surface-input':'#141311',
        'surface-dark':'#141311','on-surface-dark':'#F3EFE6',
        'muted':'#5E5A52','on-muted':'#F3EFE6','outline':'#D9D2C3',
        'success':'#2D5A3C','on-success':'#F3EFE6','error':'#9B2C2C',
        'on-error':'#FFFFFF','warning':'#8C621B','on-warning':'#FFFFFF'
      },
      fontFamily: {
        display:['Fraunces','serif'],headline:['Fraunces','serif'],
        title:['Fraunces','serif'],body:['Archivo','sans-serif'],
        label:['Archivo','sans-serif'],mono:['IBM Plex Mono','monospace']
      },
      borderRadius:{none:'0',sm:'2px',DEFAULT:'2px',md:'4px'},
      spacing:{'page-margin':'48px','page-margin-mobile':'20px',section:'64px','section-lg':'96px'},
      fontSize:{
        'display-lg':['84px',{lineHeight:'88px',fontWeight:'600'}],
        'display-lg-mobile':['32px',{lineHeight:'38px',fontWeight:'600'}],
        'headline-lg':['52px',{lineHeight:'58px',fontWeight:'600'}],
        'headline-lg-mobile':['32px',{lineHeight:'38px',fontWeight:'600'}],
        'headline-md':['36px',{lineHeight:'42px',fontWeight:'600'}],
        'headline-md-mobile':['28px',{lineHeight:'34px',fontWeight:'600'}],
        'headline-sm':['28px',{lineHeight:'34px',fontWeight:'500'}],
        'title-lg':['22px',{lineHeight:'28px',fontWeight:'500'}],
        'body-lg':['18px',{lineHeight:'28px'}],
        'body-md':['16px',{lineHeight:'24px'}],
        'label-lg':['15px',{lineHeight:'20px'}],
        'label-md':['14px',{lineHeight:'18px'}],
        'label-sm':['12px',{lineHeight:'16px'}],
        'mono-lg':['18px',{lineHeight:'24px'}],
        'mono-md':['14px',{lineHeight:'20px'}],
        'mono-sm':['12px',{lineHeight:'16px'}]
      }
    }
  },
  plugins: []
};
