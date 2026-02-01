import svgPaths from "./svg-53fdswuvq4";
import { img, imgGroup } from "./svg-fidba";

interface Component1512WDefaultProps {
  className?: string;
  fromAccountName?: string;
  fromAccountBalance?: number;
  toAccountName?: string;
  toAccountBalance?: number;
  amount?: number;
  date?: string;
  memo?: string;
}

// Helper to format currency
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

// Helper to format account name with last 4 digits
function formatAccountName(name: string, balance: number): string {
  // Extract last 4 digits from account name if it contains numbers, otherwise use default
  const match = name.match(/(\d{4})/);
  const last4 = match ? match[1] : '6293';
  return `${name.toUpperCase()} (...${last4}): ${formatCurrency(balance)}`;
}

export default function Component1512WDefault({ 
  className,
  fromAccountName = 'TOTAL CHECKING',
  fromAccountBalance = 6147.47,
  toAccountName = 'TOTAL SAVINGS',
  toAccountBalance = 30676.76,
  amount = 200.00,
  date = '01/31/2026',
  memo = 'Transfer Dining Savings.',
}: Component1512WDefaultProps) {
  return (
    <div className={className || "h-[809px] relative w-[1512px]"} data-name="1512w default" style={{ backgroundImage: "linear-gradient(90deg, rgb(236, 239, 241) 0%, rgb(236, 239, 241) 100%), linear-gradient(90deg, rgb(255, 255, 255) 0%, rgb(255, 255, 255) 100%)" }}>
      <div className="absolute bottom-[424px] contents right-px" data-name="Group">
        <div className="absolute bottom-0 h-[286px] pointer-events-none right-px">
          <div className="h-[280px] pointer-events-auto sticky top-0 w-[350px]" data-name="Vector">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 350 280">
              <path d={svgPaths.p36c797c0} fill="var(--fill-0, white)" id="Vector" />
            </svg>
          </div>
        </div>
        <div className="absolute bottom-[662px] h-[48px] right-px w-[350px]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 350 48">
            <path d={svgPaths.p21babe80} fill="var(--fill-0, #005EB8)" id="Vector" />
          </svg>
        </div>
        <div className="absolute bottom-[700px] font-['Inter:Bold',sans-serif] font-bold leading-[normal] not-italic right-[295px] text-[0px] text-white translate-x-full translate-y-full whitespace-nowrap">
          <p className="mb-0 text-[15px]">Chase Assistant</p>
          <p className="font-['Inter:Regular',sans-serif] font-normal text-[12px]">Powered by AI</p>
        </div>
        <div className="absolute bottom-[686px] contents right-[55.17px]" data-name="Group">
          <div className="absolute bottom-[686px] h-0 right-[55.17px] w-[11.666px]" data-name="Group">
            <div className="absolute inset-[-0.83px_-7.14%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.3328 1.6666">
                <g id="Group">
                  <path d="M0.8333 0.8333H12.4995" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
                </g>
              </svg>
            </div>
          </div>
        </div>
        <div className="absolute bottom-[681px] contents right-[22px]" data-name="Group">
          <div className="absolute bottom-[681px] right-[22px] size-[10px]" data-name="Group">
            <div className="absolute inset-[-5.89%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11.1781 11.1781">
                <g id="Group">
                  <path d={svgPaths.p2d54bb80} id="Vector" stroke="var(--stroke-0, white)" strokeWidth="1.6666" />
                  <path d={svgPaths.p35fbc00} id="Vector_2" stroke="var(--stroke-0, white)" strokeWidth="1.6666" />
                </g>
              </svg>
            </div>
          </div>
        </div>
        <p className="absolute bottom-[646px] font-['Inter:Regular',sans-serif] font-normal leading-[normal] not-italic right-[176px] text-[#717171] text-[11px] text-center translate-x-1/2 translate-y-full">Today, 10:42 AM</p>
        <div className="absolute bottom-[552px] h-[68px] right-[66px] w-[229px]" data-name="Group">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 229 68">
            <g id="Group">
              <path d={svgPaths.p1f299a00} fill="var(--fill-0, #F4F5F7)" id="Vector" />
            </g>
          </svg>
        </div>
        <div className="absolute bottom-[441.88px] contents right-[12px]" data-name="Group">
          <div className="absolute bottom-[441.88px] h-[48.116px] right-[12px] w-[330px]" data-name="Vector">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 330 48.1158">
              <path d={svgPaths.p15f75c80} fill="url(#paint0_linear_1_6161)" id="Vector" opacity="0.3" />
              <defs>
                <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_6161" x1="0" x2="1373.9" y1="0" y2="9422.84">
                  <stop stopColor="#4E7CFF" />
                  <stop offset="0.5" stopColor="#9C6DFF" />
                  <stop offset="1" stopColor="#FF8484" />
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div className="absolute bottom-[443.82px] h-[44.552px] right-[14.18px] w-[326.163px]" data-name="Vector">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 326.163 44.5517">
              <path d={svgPaths.pa8f8480} fill="var(--fill-0, white)" id="Vector" />
            </svg>
          </div>
          <div className="absolute bottom-[456.12px] h-[21.385px] right-[304.85px] w-[23.023px]" data-name="Vector">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 23.0233 21.3848">
              <path d={svgPaths.p22763c00} fill="var(--fill-0, #F0F0F0)" id="Vector" />
            </svg>
          </div>
          <div className="absolute bottom-[463.7px] h-[6.237px] right-[313px] w-[6.715px]" data-name="Group">
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.71513 6.23726">
              <g id="Group">
                <path d="M0 3.11882H6.71512" id="Vector" stroke="var(--stroke-0, #666666)" strokeWidth="0.5" />
                <path d="M3.35753 0V6.23723" id="Vector_2" stroke="var(--stroke-0, #666666)" strokeWidth="0.5" />
              </g>
            </svg>
          </div>
          <p className="absolute bottom-[474px] font-['Inter:Regular',sans-serif] font-normal h-[15px] leading-[normal] not-italic right-[292px] text-[#999] text-[14px] translate-x-full translate-y-full w-[146px] whitespace-pre-wrap">Ask anything...</p>
          <div className="absolute bottom-[457.92px] contents right-[66.14px]" data-name="Group">
            <div className="absolute bottom-[457.92px] h-[14.85px] right-[66.14px] w-[11.191px]" data-name="Group">
              <div className="absolute inset-[-5.61%_-7.45%_-5.61%_-7.44%]">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.858 16.5165">
                  <g id="Group">
                    <path d={svgPaths.p1c8649c0} id="Vector" stroke="var(--stroke-0, #666666)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
                    <path d={svgPaths.p39078300} id="Vector_2" stroke="var(--stroke-0, #666666)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
          <div className="absolute bottom-[458.66px] h-[13.368px] right-[30.17px] w-[15.191px]" data-name="Group">
            <div className="absolute inset-[-6.23%_-5.49%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.8571 15.0348">
                <g id="Group">
                  <path d={svgPaths.p2ef2a880} id="Vector" stroke="url(#paint0_linear_1_6147)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.6666" />
                </g>
                <defs>
                  <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_6147" x1="0.833303" x2="1326.81" y1="0.833297" y2="1507.56">
                    <stop stopColor="#4E7CFF" />
                    <stop offset="0.5" stopColor="#9C6DFF" />
                    <stop offset="1" stopColor="#FF8484" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>
        <div className="absolute bottom-[671.75px] h-[24.252px] right-[307.73px] w-[26.274px]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 26.2737 24.2521">
            <path d={svgPaths.p360c5880} fill="url(#paint0_linear_1_6145)" id="Vector" />
            <defs>
              <linearGradient gradientUnits="userSpaceOnUse" id="paint0_linear_1_6145" x1="0" x2="2417.46" y1="0" y2="2618.97">
                <stop stopColor="#4E7CFF" />
                <stop offset="0.5" stopColor="#9C6DFF" />
                <stop offset="1" stopColor="#FF8484" />
              </linearGradient>
            </defs>
          </svg>
        </div>
        <div className="absolute bottom-[591.55px] right-[307.6px] size-[35.032px]" data-name="Vector">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 35.0316 35.0316">
            <path d={svgPaths.p21833980} fill="var(--fill-0, #F0F4FF)" id="Vector" />
          </svg>
        </div>
        <div className="absolute bottom-[596.9px] content-stretch flex items-start overflow-clip right-[313.53px]" data-name="Chase logo">
          <div className="content-stretch flex flex-col items-start justify-end overflow-clip relative shrink-0 size-[24px]" data-name="logo_chase_octagon_wht.svg fill">
            <div className="overflow-clip relative shrink-0 size-[24px]" data-name="Component 1">
              <div className="absolute inset-[0_2.4%_71.72%_32.2%]" data-name="Vector">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.6944 6.78764">
                  <path clipRule="evenodd" d={svgPaths.p2db2900} fill="var(--fill-0, #0088FF)" fillRule="evenodd" id="Vector" />
                </svg>
              </div>
              <div className="absolute inset-[32.24%_0.01%_2.37%_71.71%]" data-name="Vector">
                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.7871 15.6927">
                  <path clipRule="evenodd" d={svgPaths.p13ff1080} fill="var(--fill-0, #0088FF)" fillRule="evenodd" id="Vector" />
                </svg>
              </div>
              <div className="absolute contents inset-[2.38%_32.27%_0_0]" data-name="Mask group">
                <div className="absolute inset-[2.38%_32.27%_0_-0.04%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0.01px_0px] mask-size-[16.256px_23.429px]" data-name="Group" style={{ maskImage: `url('${img}')` }}>
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.266 23.4287">
                    <g id="Group">
                      <path clipRule="evenodd" d={svgPaths.p2d61fc00} fill="var(--fill-0, #0088FF)" fillRule="evenodd" id="Vector" />
                      <path clipRule="evenodd" d={svgPaths.pdfbf300} fill="var(--fill-0, #0088FF)" fillRule="evenodd" id="Vector_2" />
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-[594px] flex flex-col font-['Inter:Regular',sans-serif] font-normal h-[44px] justify-center leading-[0] not-italic right-[286px] text-[#040404] text-[12px] translate-x-full translate-y-1/2 w-[242px]">
          <p className="leading-[normal] whitespace-pre-wrap">Please double check the information below, and click next when finished.</p>
        </div>
      </div>
      <div className="-translate-y-1/2 absolute content-stretch flex flex-col isolate items-start left-0 right-0 top-[calc(50%+77.15px)]" data-name="div#main">
        <div className="bg-[#eceff1] content-stretch flex flex-col items-start shrink-0 sticky top-0 w-full z-[2]" data-name="div#header-outer-container">
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="div#header-inner-fixed-container">
            <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full" data-name="div#siteheader-container">
              <div className="content-stretch flex flex-col items-start justify-center relative shrink-0 w-full" data-name="div.foundation_theme">
                <div className="bg-[#005eb8] relative shrink-0 w-full" data-name="div">
                  <div className="content-stretch flex flex-col items-start px-[36px] relative w-full">
                    <div className="max-w-[1440px] min-h-[60px] relative shrink-0 w-full" data-name="div#brandbar-container">
                      <div className="flex flex-row items-center max-w-[inherit] min-h-[inherit] size-full">
                        <div className="content-stretch flex gap-[1133.14px] items-center max-w-[inherit] min-h-[inherit] pl-[24px] pr-[24.01px] py-[12px] relative w-full">
                          <div className="content-stretch flex gap-[8px] items-center relative shrink-0" data-name="div.bdjfhfgwpmpom0">
                            <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="div.afe7r5a1j1qh4s1">
                              <div className="content-stretch flex items-start p-[6px] relative rounded-[4px] shrink-0" data-name="Main menu">
                                <div className="relative shrink-0 size-[24px]" data-name="Frame">
                                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                                    <g id="Component 1">
                                      <path d={svgPaths.p359de570} fill="var(--fill-0, white)" id="Vector" />
                                    </g>
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <div className="content-stretch flex items-center justify-center relative shrink-0" data-name="div#bc__logo-container">
                              <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="a.emims2vqptmj0">
                                <div className="content-stretch flex flex-col h-[24px] items-start relative shrink-0 w-full" data-name="picture">
                                  <div className="content-stretch flex items-start overflow-clip relative shrink-0" data-name="Chase logo">
                                    <div className="content-stretch flex flex-col items-start justify-end overflow-clip relative shrink-0 size-[24px]" data-name="logo_chase_octagon_wht.svg fill">
                                      <div className="overflow-clip relative shrink-0 size-[24px]" data-name="logo_chase_octagon_wht.svg">
                                        <div className="absolute inset-[0_2.4%_71.72%_32.2%]" data-name="Vector">
                                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 15.6944 6.78764">
                                            <path clipRule="evenodd" d={svgPaths.p2db2900} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector" />
                                          </svg>
                                        </div>
                                        <div className="absolute inset-[32.24%_0.01%_2.37%_71.71%]" data-name="Vector">
                                          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.7871 15.6927">
                                            <path clipRule="evenodd" d={svgPaths.p13ff1080} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector" />
                                          </svg>
                                        </div>
                                        <div className="absolute contents inset-[2.38%_32.27%_0_0]" data-name="Mask group">
                                          <div className="absolute inset-[2.38%_32.27%_0_-0.04%] mask-alpha mask-intersect mask-no-clip mask-no-repeat mask-position-[0.01px_0px] mask-size-[16.256px_23.429px]" data-name="Group" style={{ maskImage: `url('${imgGroup}')` }}>
                                            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16.266 23.4287">
                                              <g id="Group">
                                                <path clipRule="evenodd" d={svgPaths.p2d61fc00} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector" />
                                                <path clipRule="evenodd" d={svgPaths.pdfbf300} fill="var(--fill-0, white)" fillRule="evenodd" id="Vector_2" />
                                              </g>
                                            </svg>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="content-stretch flex gap-[16px] items-center justify-end pl-[16px] relative shrink-0" data-name="div.bdjfhfgwpmpom0">
                            <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="div#brand_bar_search_button">
                              <div className="content-stretch flex items-start p-[6px] relative rounded-[4px] shrink-0" data-name="Search">
                                <div className="relative shrink-0 size-[24px]" data-name="Frame">
                                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                                    <g id="Component 1">
                                      <path d={svgPaths.p1d5d6780} fill="var(--fill-0, white)" id="Vector" />
                                    </g>
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="div.c67av0t1nudfwo0">
                              <div className="content-stretch flex items-start p-[6px] relative rounded-[4px] shrink-0" data-name="Profile & settings">
                                <div className="relative shrink-0 size-[24px]" data-name="Frame">
                                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
                                    <g id="Component 1">
                                      <path d={svgPaths.p17fe2200} fill="var(--fill-0, white)" id="Vector" />
                                    </g>
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[4px] shrink-0" data-name="button#brand_bar_sign_in_out">
                              <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="span.qkh7qg6qocxgw0">
                                <div className="flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[14px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                                  <p className="leading-[20px]">Sign out</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-[#005eb8] max-w-[1440px] min-w-[320px] relative shrink-0 w-full" data-name="Primary">
                      <div className="flex flex-row items-center max-w-[inherit] min-w-[inherit] size-full">
                        <div className="content-stretch flex items-center max-w-[inherit] min-w-[inherit] px-[24px] py-[8px] relative w-full">
                          <div className="content-stretch flex flex-[1_0_0] gap-[16px] items-start min-h-px min-w-px relative" data-name="div.primary-navigation-bar__list">
                            <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0" data-name="div#navigation-bar__menu-item-requestAccounts">
                              <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[4px] shrink-0" data-name="button#requestAccounts">
                                <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="span.qkh7qg6qocxgw0">
                                  <div className="flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[16px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                                    <p className="leading-[20px]">Accounts</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0" data-name="div#navigation-bar__menu-item-requestPaymentsAndTransfers">
                              <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[4px] shrink-0" data-name="button#requestPaymentsAndTransfers">
                                <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="span.qkh7qg6qocxgw0">
                                  <div className="flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[16px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                                    <p className="leading-[20px]">{`Pay & transfer`}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0" data-name="div#navigation-bar__menu-item-requestPlanTrack">
                              <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[4px] shrink-0" data-name="button#requestPlanTrack">
                                <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="span.qkh7qg6qocxgw0">
                                  <div className="flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[16px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                                    <p className="leading-[20px]">{`Plan & track`}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0" data-name="div#navigation-bar__menu-item-requestChaseInvestmentsMenu">
                              <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[4px] shrink-0" data-name="button#requestChaseInvestmentsMenu">
                                <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="span.qkh7qg6qocxgw0">
                                  <div className="flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[16px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                                    <p className="leading-[20px]">Investments</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0" data-name="div#navigation-bar__menu-item-requestBenefitsAndTravel">
                              <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[4px] shrink-0" data-name="button#requestBenefitsAndTravel">
                                <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="span.qkh7qg6qocxgw0">
                                  <div className="flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[16px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                                    <p className="leading-[20px]">{`Benefits & travel`}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0" data-name="div#navigation-bar__menu-item-requestSecurityCenter">
                              <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[4px] shrink-0" data-name="button#requestSecurityCenter">
                                <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="span.qkh7qg6qocxgw0">
                                  <div className="flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[16px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                                    <p className="leading-[20px]">{`Security & privacy`}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="content-stretch flex flex-col items-start relative self-stretch shrink-0" data-name="div#navigation-bar__menu-item-requestExploreChaseProductsMenu">
                              <div className="content-stretch flex items-center justify-center px-[8px] py-[4px] relative rounded-[4px] shrink-0" data-name="button#requestExploreChaseProductsMenu">
                                <div className="content-stretch flex flex-col items-center relative shrink-0" data-name="span.qkh7qg6qocxgw0">
                                  <div className="flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[16px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                                    <p className="leading-[20px]">Explore products</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white relative shrink-0 w-full" data-name="div.bottom-menu-container">
              <div aria-hidden="true" className="absolute border-[#e5e5e5] border-b border-solid inset-0 pointer-events-none" />
              <div className="content-stretch flex flex-col items-start pb-px px-[36px] relative w-full">
                <div className="relative shrink-0 w-full" data-name="div.util">
                  <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative w-full">
                    <div className="absolute left-0 overflow-clip size-px top-[-0.06px]" data-name="h1#navMenuHiddenH1">
                      <div className="-translate-y-1/2 absolute flex flex-col font-['Open_Sans:Bold',sans-serif] font-bold h-[44px] justify-center leading-[0] left-0 text-[32px] text-black top-[22px] w-[781.382px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                        <p className="leading-[normal] whitespace-pre-wrap">{`Pay & transfer Transfer money Schedule transfer`}</p>
                      </div>
                    </div>
                    <div className="content-stretch flex gap-[28.2px] items-center relative shrink-0 w-[706.22px]" data-name="ul#bottom-level-main-nav">
                      <div className="bg-[#128842] content-stretch flex items-start px-[24px] py-[11px] relative shrink-0" data-name="li.DATABOLD">
                        <div className="flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[16px] text-white whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                          <p className="leading-[normal]">Transfer money</p>
                        </div>
                      </div>
                      <div className="content-stretch flex items-start py-[4px] relative shrink-0" data-name="li.list-item">
                        <div aria-hidden="true" className="absolute border-[#128842] border-b-4 border-solid inset-0 pointer-events-none" />
                        <div className="relative shrink-0" data-name="a#transferFunds">
                          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start py-[7px] relative">
                            <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#414042] text-[16px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                              <p className="leading-[normal]">Schedule transfer</p>
                            </div>
                            <div className="absolute left-[131.14px] overflow-clip size-px top-[7px]" data-name="span.util">
                              <div className="-translate-y-1/2 absolute flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal h-[21.5px] justify-center leading-[0] left-0 text-[#414042] text-[16px] top-[10.75px] w-[134.11px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                                <p className="leading-[normal] whitespace-pre-wrap">, current selection</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col items-start pl-[23.96px] py-[7px] relative shrink-0" data-name="a#activityTransfer">
                        <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#414042] text-[16px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                          <p className="leading-[normal]">Transfer activity</p>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col items-start pl-[23.95px] py-[7px] relative shrink-0" data-name="a#manageExternalAccounts">
                        <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#414042] text-[16px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                          <p className="leading-[normal]">External accounts</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bg-white content-stretch flex flex-col items-start left-[-1600px] px-[17px] py-[12.2px] rounded-[5px] top-0" data-name="mds-link">
            <div aria-hidden="true" className="absolute border border-[#717171] border-solid inset-0 pointer-events-none rounded-[5px]" />
            <div className="relative shrink-0" data-name="Skip to main content">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative">
                <div className="flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#005eb8] text-[16px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                  <p className="leading-[normal]">Skip to main content</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bg-white content-stretch flex flex-col items-start left-[-1600px] px-[17px] py-[12.2px] rounded-[5px] top-[60px]" data-name="mds-link">
            <div aria-hidden="true" className="absolute border border-[#717171] border-solid inset-0 pointer-events-none rounded-[5px]" />
            <div className="relative shrink-0" data-name="Skip primary navigation">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative">
                <div className="flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#005eb8] text-[16px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                  <p className="leading-[normal]">Skip primary navigation</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bg-white content-stretch flex flex-col items-start left-[-1600px] px-[17px] py-[12.2px] rounded-[5px] top-[104px]" data-name="mds-link">
            <div aria-hidden="true" className="absolute border border-[#717171] border-solid inset-0 pointer-events-none rounded-[5px]" />
            <div className="relative shrink-0" data-name="Skip secondary navigation">
              <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-start relative">
                <div className="flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#005eb8] text-[16px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                  <p className="leading-[normal]">Skip secondary navigation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-[#eceff1] relative shrink-0 w-full z-[1]" data-name="div#content">
          <div className="content-stretch flex flex-col items-start px-[36px] relative w-full">
            <div className="bg-white max-w-[1440px] relative shrink-0 w-full" data-name="div#transferMoneyContainer">
              <div className="content-stretch flex flex-col items-start max-w-[inherit] pt-[24px] px-[12px] relative w-full">
                <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="div.row">
                  <div className="content-stretch flex flex-col items-start min-h-px pb-[13.28px] pt-[13.27px] px-[12px] relative shrink-0 w-[1298px]" data-name="div.col-xs-11">
                    <div className="content-stretch flex flex-col items-start pb-[12px] relative shrink-0 w-full" data-name="h2.transferActivityTitleHeader">
                      <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#414042] text-[16px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                        <p className="leading-[normal] whitespace-pre-wrap">{fromAccountName.toUpperCase()} (...6293) Transfer Activity</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="content-stretch flex flex-col gap-[24px] items-start relative shrink-0 w-[1404px]" data-name="div">
                  <div className="content-stretch flex items-start relative shrink-0 w-[1416px]" data-name="div.row">
                    <div className="flex-[1_0_0] min-h-px min-w-px relative" data-name="div.col-xs-12">
                      <div className="content-stretch flex flex-col gap-[8px] items-start min-h-[inherit] px-[12px] relative w-full">
                        <div className="content-stretch flex items-start justify-center relative shrink-0 w-full" data-name="div.flyoutContainer">
                          <div className="content-stretch flex flex-[1_0_0] flex-col items-start min-h-px min-w-px relative self-stretch" data-name="mds-select">
                            <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="div.mds-select__container">
                              <div className="content-stretch flex flex-col items-start pb-[0.25px] pt-[1.75px] relative shrink-0 w-full" data-name="div.mds-select__label-wrap">
                                <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#126bc5] text-[14px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                                  <p className="leading-[20px] whitespace-pre-wrap">Transfer from</p>
                                </div>
                              </div>
                              <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="div.mds-select__background-container">
                                <div className="bg-white min-h-[40px] relative shrink-0 w-full" data-name="button listbox#select-fundingAccountId">
                                  <div className="flex flex-col justify-center min-h-[inherit] overflow-clip rounded-[inherit] size-full">
                                    <div className="content-stretch flex flex-col items-start justify-center min-h-[inherit] pl-[16px] pr-[48px] py-[8px] relative w-full">
                                      <div className="content-stretch flex items-start relative shrink-0" data-name="span">
                                        <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#0f171f] text-[16px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                                          <p className="leading-[24px]">{formatAccountName(fromAccountName, fromAccountBalance)}</p>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0px_0px_1px_#768799]" />
                                </div>
                                <div className="absolute left-0 overflow-clip size-px top-[40px]" data-name="span#label-value-announcement-fundingAccountId">
                                  <div className="-translate-y-1/2 absolute flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal h-[21.5px] justify-center leading-[0] left-0 text-[16px] text-black top-[10.75px] w-[62.696px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                                    <p className="leading-[normal] whitespace-pre-wrap">Transfer</p>
                                  </div>
                                </div>
                                <div className="absolute content-stretch flex items-start pr-[12px] right-0 top-[12px]" data-name="span.mds-select__icon">
                                  <div className="relative shrink-0 size-[16px]" data-name="Frame">
                                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                                      <g id="Component 1">
                                        <path d={svgPaths.p24687f40} fill="var(--fill-0, #126BC5)" id="Vector" />
                                      </g>
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="div.NOTE">
                          <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#717171] text-[12px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                            <p className="leading-[normal]">{`Don't see your account? `}</p>
                          </div>
                          <div className="content-stretch flex items-start relative shrink-0" data-name="mds-link">
                            <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#005eb8] text-[12px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                              <p className="leading-[normal]">Link an external account</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-[1_0_0] min-h-px min-w-px relative" data-name="div.col-xs-12">
                      <div className="content-stretch flex flex-col gap-[8px] items-start min-h-[inherit] px-[12px] relative w-full">
                        <div className="content-stretch flex flex-col gap-[8px] items-start relative shrink-0 w-full" data-name="mds-select">
                          <div className="content-stretch flex flex-col items-start pb-[0.25px] pt-[1.75px] relative shrink-0 w-full" data-name="div.mds-select__label-wrap">
                            <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#126bc5] text-[14px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                              <p className="leading-[20px] whitespace-pre-wrap">Transfer to</p>
                            </div>
                          </div>
                          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="div.mds-select__background-container">
                            <div className="bg-white min-h-[40px] relative shrink-0 w-full" data-name="button listbox#select-transferToAccountId">
                              <div className="flex flex-col justify-center min-h-[inherit] overflow-clip rounded-[inherit] size-full">
                                <div className="content-stretch flex flex-col items-start justify-center min-h-[inherit] pl-[16px] pr-[48px] py-[8px] relative w-full">
                                  <div className="content-stretch flex items-start relative shrink-0" data-name="span">
                                    <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#0f171f] text-[16px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                                      <p className="leading-[24px]">{formatAccountName(toAccountName, toAccountBalance)}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0px_0px_1px_#768799]" />
                            </div>
                            <div className="absolute left-0 overflow-clip size-px top-[40px]" data-name="span#label-value-announcement-transferToAccountId">
                              <div className="-translate-y-1/2 absolute flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal h-[21.5px] justify-center leading-[0] left-0 text-[16px] text-black top-[10.75px] w-[62.696px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                                <p className="leading-[normal] whitespace-pre-wrap">Transfer</p>
                              </div>
                            </div>
                            <div className="absolute content-stretch flex items-start pr-[12px] right-0 top-[12px]" data-name="span.mds-select__icon">
                              <div className="relative shrink-0 size-[16px]" data-name="Frame">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                                  <g id="Component 1">
                                    <path d={svgPaths.p24687f40} fill="var(--fill-0, #126BC5)" id="Vector" />
                                  </g>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="content-stretch flex items-start relative shrink-0 w-full" data-name="div.NOTE">
                          <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#717171] text-[12px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                            <p className="leading-[normal]">{`Don't see your account? `}</p>
                          </div>
                          <div className="content-stretch flex items-start relative shrink-0" data-name="mds-link">
                            <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#005eb8] text-[12px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                              <p className="leading-[normal]">Link an external account</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex-[1_0_0] min-h-px min-w-px relative" data-name="div.col-xs-12">
                      <div className="content-stretch flex flex-col items-start min-h-[inherit] px-[12px] relative w-full">
                        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="mds-text-input">
                          <div className="content-stretch flex items-start pb-[8px] relative shrink-0 w-full" data-name="div.mds-text-input__label-wrap">
                            <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[448px] min-h-px min-w-px relative self-stretch" data-name="label.mds-text-input__label">
                              <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#126bc5] text-[14px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                                <p className="leading-[20px] whitespace-pre-wrap">Amount</p>
                              </div>
                            </div>
                          </div>
                          <div className="bg-white min-h-[40px] relative shrink-0 w-full" data-name="input#transactionAmount-input">
                            <div className="min-h-[inherit] overflow-clip rounded-[inherit] size-full">
                              <div className="content-stretch flex flex-col items-start min-h-[inherit] px-[16px] py-[8px] relative w-full">
                                <div className="content-stretch flex flex-col items-start overflow-auto relative shrink-0 w-full" data-name="div">
                                  <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#0f171f] text-[16px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                                    <p className="leading-[24px] whitespace-pre-wrap">{formatCurrency(amount)}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0px_0px_1px_#768799]" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[12px] items-start pl-[484px] relative shrink-0 w-[1416px]" data-name="div.row">
                    <div className="content-stretch flex flex-col items-start relative shrink-0 w-[448px]" data-name="mds-datepicker → mds-text-input">
                      <div className="content-stretch flex items-start pb-[8px] relative shrink-0 w-full" data-name="div.mds-text-input__label-wrap">
                        <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[448px] min-h-px min-w-px relative self-stretch" data-name="label.mds-text-input__label">
                          <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#126bc5] text-[14px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                            <p className="leading-[20px] whitespace-pre-wrap">Transfer date</p>
                          </div>
                        </div>
                      </div>
                      <div className="content-stretch flex flex-col items-start pb-[4px] relative shrink-0 w-full" data-name="div.mds-text-input__input-wrap">
                        <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="div.mds-select__background-container">
                          <div className="bg-white min-h-[40px] relative shrink-0 w-full" data-name="button listbox#select-transferToAccountId">
                            <div className="flex flex-col justify-center min-h-[inherit] overflow-clip rounded-[inherit] size-full">
                              <div className="content-stretch flex flex-col items-start justify-center min-h-[inherit] pl-[16px] pr-[48px] py-[8px] relative w-full">
                                <div className="content-stretch flex items-start relative shrink-0" data-name="span">
                                  <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#0f171f] text-[16px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                                    <p className="leading-[24px]">{date}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0px_0px_1px_#768799]" />
                          </div>
                          <div className="absolute left-0 overflow-clip size-px top-[40px]" data-name="span#label-value-announcement-transferToAccountId">
                            <div className="-translate-y-1/2 absolute flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal h-[21.5px] justify-center leading-[0] left-0 text-[16px] text-black top-[10.75px] w-[62.696px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                              <p className="leading-[normal] whitespace-pre-wrap">Transfer</p>
                            </div>
                          </div>
                          <div className="absolute content-stretch flex items-start pr-[12px] right-0 top-[12px]" data-name="span.mds-select__icon">
                            <div className="relative shrink-0 size-[16px]" data-name="Frame">
                              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
                                <g id="Component 1">
                                  <path d={svgPaths.p24687f40} fill="var(--fill-0, #126BC5)" id="Vector" />
                                </g>
                              </svg>
                            </div>
                          </div>
                        </div>
                        <div className="absolute content-stretch flex items-start right-[3px] top-[3px]" data-name="mds-text-input-button">
                          <div className="bg-[#d6d9db] content-stretch flex h-[34px] items-center justify-center relative rounded-[4px] shrink-0 w-[36px]" data-name="Opens calendar: Choose send on date">
                            <div className="content-stretch flex items-start relative shrink-0" data-name="span.text-input-button__icon">
                              <div className="relative shrink-0 size-[20px]" data-name="Frame">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                                  <g id="Frame">
                                    <path d={svgPaths.p1dc3dd00} fill="var(--fill-0, #85888A)" id="Vector" />
                                  </g>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col items-start min-h-px px-[12px] relative shrink-0 w-[472px]" data-name="div.col-xs-12">
                      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full" data-name="mds-text-input">
                        <div className="content-stretch flex items-start pb-[8px] relative shrink-0 w-full" data-name="div.mds-text-input__label-wrap">
                          <div className="content-stretch flex flex-[1_0_0] flex-col items-start max-w-[448px] min-h-px min-w-px relative self-stretch" data-name="label.mds-text-input__label">
                            <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#126bc5] text-[14px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                              <p className="leading-[20px] whitespace-pre-wrap">Note to self (optional)</p>
                            </div>
                          </div>
                        </div>
                        <div className="content-stretch flex flex-col gap-[4.5px] items-start relative shrink-0 w-full" data-name="div.mds-text-input__input-wrap">
                          <div className="bg-white min-h-[40px] relative shrink-0 w-full" data-name="input#transactionMemo-input">
                            <div className="min-h-[inherit] overflow-clip rounded-[inherit] size-full">
                              <div className="content-stretch flex flex-col items-start min-h-[inherit] pb-[9.5px] pt-[9px] px-[16px] relative w-full">
                                <div className="content-stretch flex flex-col items-start overflow-clip relative shrink-0 w-full" data-name="div#placeholder">
                                  <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#126bc5] text-[16px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                                    <p className="leading-[normal] whitespace-pre-wrap">{memo || ''}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0px_0px_1px_#768799]" />
                          </div>
                          <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#126bc5] text-[12px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                            <p className="leading-[16px]">32 of 32 characters remaining.</p>
                          </div>
                          <div className="content-stretch flex flex-col items-start pt-[0.5px] relative shrink-0 w-full" data-name="p#transactionMemo-microcopy">
                            <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#126bc5] text-[12px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                              <p className="leading-[16px] whitespace-pre-wrap">Use only letters, numbers or basic punctuation.</p>
                            </div>
                          </div>
                        </div>
                        <div className="absolute left-0 overflow-clip size-px top-[109.5px]" data-name="span#transactionMemo-character-count-text">
                          <div className="-translate-y-1/2 absolute flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal h-[21.5px] justify-center leading-[0] left-0 text-[16px] text-black top-[10.75px] w-[18.608px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                            <p className="leading-[normal] whitespace-pre-wrap">32</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-[1416px]" data-name="div.row">
                    <div className="content-stretch flex flex-col items-start min-h-px px-[12px] relative shrink-0 w-[472px]" data-name="div.col-xs-12">
                      <div className="content-stretch flex items-center justify-between relative shrink-0 w-full" data-name="mds-switch">
                        <div className="content-stretch flex flex-col items-start relative shrink-0" data-name="label.switch__label">
                          <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#85888a] text-[16px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                            <p className="leading-[24px]">Set up repeating transfers</p>
                          </div>
                        </div>
                        <div className="h-[24px] relative shrink-0 w-[87.18px]" data-name="div.switch__wrap">
                          <div className="absolute bg-[#768799] content-stretch flex h-[14px] items-start justify-end opacity-24 pt-[14px] right-[37.18px] rounded-[7px] top-[5.72px] w-[34px]" data-name="div.switch__label-wrapper">
                            <div className="bg-[rgba(239,239,239,0.3)] h-[6px] opacity-0 relative shrink-0 w-[16px]" data-name="Set up repeating transfers">
                              <div aria-hidden="true" className="absolute border-2 border-[rgba(118,118,118,0.3)] border-solid inset-0 pointer-events-none" />
                            </div>
                            <div className="absolute bg-white bottom-[-3px] left-[-2px] rounded-[10px] size-[20px]" data-name="::before">
                              <div aria-hidden="true" className="absolute border border-[#768799] border-solid inset-0 pointer-events-none rounded-[10px] shadow-[-1px_1px_3px_1px_rgba(0,0,0,0.08)]" />
                            </div>
                          </div>
                          <div className="-translate-y-1/2 absolute flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold h-[24px] justify-center leading-[0] right-[-0.33px] text-[#85888a] text-[14px] text-right top-[11.75px] w-[21.506px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                            <p className="leading-[24px] whitespace-pre-wrap">Off</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex flex-col items-start relative shrink-0 w-[1416px]" data-name="div.row">
                    <div className="content-stretch flex items-start min-h-px px-[12px] relative shrink-0 w-[708px]" data-name="div#transferAgreementLink">
                      <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#414042] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                        <p className="leading-[normal]">{`The terms of the `}</p>
                      </div>
                      <div className="content-stretch flex items-start relative shrink-0" data-name="a">
                        <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#126bc5] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                          <p className="decoration-solid leading-[normal] underline">Transfers Agreement</p>
                        </div>
                      </div>
                      <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#414042] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                        <p className="leading-[normal]">{` apply to these transactions.`}</p>
                      </div>
                    </div>
                  </div>
                  <div className="content-stretch flex gap-[12px] items-start pb-[32px] pl-[956px] pt-[8px] relative shrink-0 w-[1416px]" data-name="div.row">
                    <div className="bg-[rgba(255,255,255,0)] content-stretch flex items-start justify-center overflow-auto px-[16px] py-[6px] relative rounded-[4px] shrink-0 w-[212px]" data-name="mds-button">
                      <div className="content-stretch flex flex-col items-center relative self-stretch shrink-0" data-name="span.button__label">
                        <div className="flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#005eb8] text-[16px] text-center whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                          <p className="leading-[24px]">Cancel</p>
                        </div>
                      </div>
                      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0px_0px_1px_#005eb8]" />
                    </div>
                    <div className="content-stretch flex flex-col items-start min-h-px px-[12px] relative shrink-0 w-[236px]" data-name="div.col-xs-12">
                      <div className="bg-[#005eb8] relative rounded-[4px] shrink-0 w-full" data-name="mds-button">
                        <div className="flex flex-row justify-center overflow-auto size-full">
                          <div className="content-stretch flex items-start justify-center px-[16px] py-[6px] relative w-full">
                            <div className="content-stretch flex flex-col items-center relative self-stretch shrink-0" data-name="span.button__label">
                              <div className="flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[16px] text-center text-white whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                                <p className="leading-[24px]">Next</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-[310.75px] min-h-px relative shrink-0 w-full" data-name="div.col-xs-12">
                  <div className="absolute bg-[#f3f0e9] content-stretch flex flex-col items-start left-[-12px] pb-[7.5px] pl-[24px] pr-[16px] pt-[8.5px] right-[-12px] top-0" data-name="span.accountAdvisory">
                    <div aria-hidden="true" className="absolute border-[#dbd5ca] border-solid border-t inset-0 pointer-events-none" />
                    <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#666] text-[12px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                      <p className="leading-[normal]">{`We update your account activity with each payment on the "Send on" date.`}</p>
                    </div>
                  </div>
                  <div className="absolute left-[12px] overflow-clip size-px top-[39.5px]" data-name="span.util">
                    <div className="-translate-y-1/2 absolute flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal h-[12px] justify-center leading-[0] left-0 text-[#666] text-[12px] top-[6px] w-[74.515px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                      <p className="leading-[12px] whitespace-pre-wrap">Transactions,</p>
                    </div>
                  </div>
                  <div className="absolute left-[105.68px] overflow-clip size-px top-[55.75px]" data-name="span#accessible-sortByTransactionDueDateIcon">
                    <div className="-translate-y-1/2 absolute flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold h-[18.5px] justify-center leading-[0] left-0 text-[#414042] text-[14px] top-[9.25px] w-[139.455px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                      <p className="leading-[normal] whitespace-pre-wrap">, sort by most recent</p>
                    </div>
                  </div>
                  <div className="absolute left-[348.16px] overflow-clip size-px top-[55.75px]" data-name="span#accessible-sortByTransactionStatusIcon">
                    <div className="-translate-y-1/2 absolute flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold h-[18.5px] justify-center leading-[0] left-0 text-[#717171] text-[14px] top-[9.25px] w-[74.374px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                      <p className="leading-[normal] whitespace-pre-wrap">, sort a to z</p>
                    </div>
                  </div>
                  <div className="absolute left-[788.37px] overflow-clip size-px top-[55.75px]" data-name="span#accessible-sortByTransferToAccountDisplayNameIcon">
                    <div className="-translate-y-1/2 absolute flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold h-[18.5px] justify-center leading-[0] left-0 text-[#717171] text-[14px] top-[9.25px] w-[197.589px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                      <p className="leading-[normal] whitespace-pre-wrap">, sort by account name, a to z</p>
                    </div>
                  </div>
                  <div className="absolute left-[1011.07px] overflow-clip size-px top-[65px]" data-name="span.util">
                    <div className="-translate-y-1/2 absolute flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold h-[18.5px] justify-center leading-[0] left-0 text-[#414042] text-[14px] top-[9.25px] w-[50.203px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                      <p className="leading-[normal] whitespace-pre-wrap">Actions</p>
                    </div>
                  </div>
                  <div className="absolute left-[1391.2px] overflow-clip size-px top-[55.75px]" data-name="span#accessible-sortByTransactionAmountIcon">
                    <div className="-translate-y-1/2 absolute flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold h-[18.5px] justify-center leading-[0] right-[-131.62px] text-[#717171] text-[14px] text-right top-[9.25px] w-[132.621px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                      <p className="leading-[normal] whitespace-pre-wrap">, sort by low to high</p>
                    </div>
                  </div>
                  <div className="absolute bg-white h-[15px] left-[12px] right-[12px] top-[32px]" data-name="caption" />
                  <div className="absolute content-stretch flex flex-col items-start left-[12px] pr-[24px] pt-[8.75px] right-[1114.02px] top-[47px]" data-name="th.sortable">
                    <div className="content-stretch flex items-center relative shrink-0" data-name="a#sortByTransactionDueDate">
                      <div className="flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#414042] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                        <p className="leading-[normal]">{`Transfer date `}</p>
                      </div>
                      <div className="content-stretch flex items-start relative shrink-0" data-name="i#icon-sortByTransactionDueDateIcon">
                        <div className="content-stretch flex items-start relative shrink-0" data-name="span.__h2d-remove-before">
                          <div className="flex items-center justify-center relative shrink-0">
                            <div className="-scale-y-100 flex-none">
                              <div className="h-[13px] relative w-[12.8px]" data-name="Icon">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.8 13">
                                  <g id="Icon">
                                    <path d={svgPaths.p2f3b3080} fill="var(--fill-0, #126BC5)" id="Vector" />
                                  </g>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute content-stretch flex flex-col items-start left-[301.98px] pr-[24px] pt-[8.75px] right-[704.96px] top-[47px]" data-name="th.sortable">
                    <div className="content-stretch flex items-center relative shrink-0" data-name="a#sortByTransactionStatus">
                      <div className="flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#717171] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                        <p className="leading-[normal]">{`Status `}</p>
                      </div>
                      <div className="content-stretch flex items-start relative shrink-0" data-name="i#icon-sortByTransactionStatusIcon">
                        <div className="content-stretch flex items-start relative shrink-0" data-name="span.__h2d-remove-before">
                          <div className="flex items-center justify-center relative shrink-0">
                            <div className="-scale-y-100 flex-none">
                              <div className="h-[13px] relative w-[12.8px]" data-name="Icon">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.8 13">
                                  <g id="Icon">
                                    <path d={svgPaths.p2f3b3080} fill="var(--fill-0, #717171)" id="Vector" />
                                  </g>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute content-stretch flex flex-col items-start left-[711.05px] pr-[24px] pt-[8.75px] right-[404.93px] top-[47px]" data-name="th.sortable">
                    <div className="content-stretch flex items-center relative shrink-0" data-name="a#sortByTransferToAccountDisplayName">
                      <div className="flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#717171] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                        <p className="leading-[normal]">{`Transfer to `}</p>
                      </div>
                      <div className="content-stretch flex items-start relative shrink-0" data-name="i#icon-sortByTransferToAccountDisplayNameIcon">
                        <div className="content-stretch flex items-start relative shrink-0" data-name="span.__h2d-remove-before">
                          <div className="flex items-center justify-center relative shrink-0">
                            <div className="-scale-y-100 flex-none">
                              <div className="h-[13px] relative w-[12.8px]" data-name="Icon">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.8 13">
                                  <g id="Icon">
                                    <path d={svgPaths.p2f3b3080} fill="var(--fill-0, #717171)" id="Vector" />
                                  </g>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute content-stretch flex flex-col items-end left-[1245.74px] pt-[8.75px] right-[12px] top-[47px]" data-name="th.amount">
                    <div className="content-stretch flex items-center justify-end relative shrink-0" data-name="a#sortByTransactionAmount">
                      <div className="flex flex-col font-['Open_Sans:SemiBold',sans-serif] font-semibold justify-center leading-[0] relative shrink-0 text-[#717171] text-[14px] text-right whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                        <p className="leading-[normal]">{`Amount `}</p>
                      </div>
                      <div className="content-stretch flex items-start justify-end relative shrink-0" data-name="i#icon-sortByTransactionAmountIcon">
                        <div className="content-stretch flex items-start relative shrink-0" data-name="span.__h2d-remove-before">
                          <div className="flex items-center justify-center relative shrink-0">
                            <div className="-scale-y-100 flex-none">
                              <div className="h-[13px] relative w-[12.8px]" data-name="Icon">
                                <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.8 13">
                                  <g id="Icon">
                                    <path d={svgPaths.p2f3b3080} fill="var(--fill-0, #717171)" id="Vector" />
                                  </g>
                                </svg>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute content-stretch flex items-start justify-center left-[12px] pb-px right-[12px] top-[74.25px]" data-name="tbody.activityRow">
                    <div aria-hidden="true" className="absolute border-[#ccc] border-b border-solid inset-0 pointer-events-none" />
                    <div className="relative shrink-0 w-[289.98px]" data-name="td#transaction0-td">
                      <div aria-hidden="true" className="absolute border-[#ccc] border-b border-solid inset-0 pointer-events-none" />
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[19.2px] pr-[24px] pt-[18px] relative w-full">
                        <div className="mb-[-0.2px] relative shrink-0 w-full" data-name="span#transaction0-span">
                          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative w-full">
                            <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#717171] text-[12px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                              <p className="leading-[21px] whitespace-pre-wrap">Initiate on</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] mb-[-0.2px] relative shrink-0 text-[#414042] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                          <p className="leading-[21px]">Jun 17, 2025</p>
                        </div>
                        <div className="mb-[-0.2px] relative shrink-0 w-full" data-name="span.subLabel">
                          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative w-full">
                            <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#717171] text-[12px] w-full" style={{ fontVariationSettings: "'wdth' 100" }}>
                              <p className="leading-[21px] whitespace-pre-wrap">Available on</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] mb-[-0.2px] relative shrink-0 text-[#414042] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                          <p className="leading-[21px]">Jun 18, 2025</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative shrink-0 w-[409.06px]" data-name="td">
                      <div aria-hidden="true" className="absolute border-[#ccc] border-b border-solid inset-0 pointer-events-none" />
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[0.25px] items-start pb-[65.5px] pr-[24px] pt-[17.75px] relative w-full">
                        <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#414042] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                          <p className="leading-[21px]">Rejected</p>
                        </div>
                        <div className="relative shrink-0 w-full" data-name="mds-alert">
                          <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex isolate items-start relative w-full">
                            <div className="content-stretch flex flex-col items-start pr-[8px] pt-[2px] relative shrink-0 z-[2]" data-name="span.alert__icon:margin">
                              <div className="content-stretch flex items-center relative shrink-0" data-name="span.alert__icon">
                                <div className="absolute bg-white left-[2px] rounded-[4px] size-[8px] top-[3px]" data-name="::after" />
                                <div className="relative shrink-0 size-[12px]" data-name="Frame">
                                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
                                    <g id="Frame">
                                      <path d={svgPaths.p9651480} fill="var(--fill-0, #DA0B16)" id="Vector" />
                                    </g>
                                  </svg>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#b20009] text-[12px] whitespace-nowrap z-[1]" style={{ fontVariationSettings: "'wdth' 100" }}>
                              <p className="leading-[16px]">We rejected this transfer.</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="relative shrink-0 w-[300.02px]" data-name="td">
                      <div aria-hidden="true" className="absolute border-[#ccc] border-b border-solid inset-0 pointer-events-none" />
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[81.75px] pr-[24px] pt-[17.75px] relative w-full">
                        <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#414042] text-[14px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                          <p className="leading-[21px]">FIDELITY (...2048)</p>
                        </div>
                      </div>
                    </div>
                    <div className="relative shrink-0 w-[234.67px]" data-name="td.action">
                      <div aria-hidden="true" className="absolute border-[#ccc] border-b border-solid inset-0 pointer-events-none" />
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start pb-[83px] pr-[24px] pt-[19px] relative w-full">
                        <div className="h-[18.5px] relative shrink-0 w-[81.59px]" data-name="See details , shows details below">
                          <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
                            <div className="absolute content-stretch flex items-start left-0 top-[7px]" data-name="i#icon-requestTransactionDetailsLabelIcon0">
                              <div className="content-stretch flex items-start relative shrink-0" data-name="span.__h2d-remove-before">
                                <div className="flex items-center justify-center relative shrink-0">
                                  <div className="-scale-y-100 flex-none">
                                    <div className="relative size-[8px]" data-name="Icon">
                                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 8">
                                        <g id="Icon">
                                          <path d={svgPaths.p9e67400} fill="var(--fill-0, #666666)" id="Vector" />
                                        </g>
                                      </svg>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="-translate-y-1/2 absolute flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal h-[21px] justify-center leading-[0] left-[11.64px] text-[#126bc5] text-[14px] top-[9.25px] w-[70.258px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                              <p className="leading-[21px] whitespace-pre-wrap">See details</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="relative shrink-0 w-[158.26px]" data-name="td.amount">
                      <div aria-hidden="true" className="absolute border-[#ccc] border-b border-solid inset-0 pointer-events-none" />
                      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-end pb-[81.75px] pt-[17.75px] relative w-full">
                        <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#414042] text-[14px] text-right whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                          <p className="leading-[21px]">$11,000.00</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="absolute content-stretch flex items-start left-0 right-0 top-[209.25px]" data-name="div.row">
                    <div className="content-stretch flex items-start min-h-px px-[12px] relative shrink-0 w-[590px]" data-name="div#requestMoneyTransferLegalAgreementLink">
                      <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#717171] text-[12px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                        <p className="leading-[normal]">{`The terms of the `}</p>
                      </div>
                      <div className="content-stretch flex items-start relative shrink-0 w-[116.79px]" data-name="a">
                        <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#126bc5] text-[12px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                          <p className="decoration-solid leading-[normal] underline">Transfers Agreement</p>
                        </div>
                      </div>
                      <div className="absolute left-[224.4px] overflow-clip size-px top-0" data-name="span">
                        <div className="-translate-y-1/2 absolute flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal h-[16px] justify-center leading-[0] left-0 text-[#126bc5] text-[12px] top-[8px] w-[3.51px]" style={{ fontVariationSettings: "'wdth' 100" }}>
                          <p className="leading-[normal] whitespace-pre-wrap">:</p>
                        </div>
                      </div>
                      <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#717171] text-[12px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                        <p className="leading-[normal]">{` apply to these transactions.`}</p>
                      </div>
                    </div>
                    <div className="content-stretch flex flex-col items-start min-h-px px-[12px] relative shrink-0 w-[590px]" data-name="div.DATALABELH">
                      <div className="flex flex-col font-['Open_Sans:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[#717171] text-[16px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
                        <p className="leading-[normal]">{`You've reached the end of your transfer activity.`}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}