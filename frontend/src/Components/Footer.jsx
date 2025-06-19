import React from 'react';
import { FaFacebookF, FaLinkedinIn, FaYoutube, FaInstagram } from 'react-icons/fa';

const Footer = () => {
  return (
    <footer className="text-sm text-white mt-8 ">
      {/* Light section above footer */}
      <div className="bg-gray-100 text-gray-800 p-6">
        <div className="max-w-6xl mx-auto flex flex-wrap justify-between gap-6">
          <div>
            <div className="font-bold text-lg">Faculty of Medicine</div>
            <div>317 - 2194 Health Sciences Mall</div>
            <div>Vancouver, BC, Canada V6T 1Z3</div>
            <a href="#" className="text-blue-800 mt-2 inline-block">
              Back to top ↑
            </a>
          </div>
          <div>
            <strong>Find us on</strong>
            <div className="flex gap-3 mt-2 text-xl">
              <a
                href="https://www.facebook.com/UBCmed/"
                aria-label="Facebook"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaFacebookF />
              </a>
              <a
                href="https://www.linkedin.com/showcase/ubc-medicine"
                aria-label="LinkedIn"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaLinkedinIn />
              </a>
              <a
                href="https://www.youtube.com/c/UBCmedicine-FoM"
                aria-label="YouTube"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaYoutube />
              </a>
              <a
                href="https://www.instagram.com/ubcmedicine/"
                aria-label="Instagram"
                target="_blank"
                rel="noopener noreferrer"
              >
                <FaInstagram />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* UBC blue footer */}
      <div style={{ backgroundColor: "#002145" }} className="py-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8 px-4">
          <div>
            <a
              href="https://www.ubc.ca/"
              className="font-semibold text-white text-lg"
            >
              The University of British Columbia
            </a>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">About UBC</h3>
              <ul className="space-y-1">
                <li>
                  <a href="https://www.ubc.ca/about/contact.html">
                    Contact UBC
                  </a>
                </li>
                <li>
                  <a href="https://www.ubc.ca/about/">About the University</a>
                </li>
                <li>
                  <a href="https://www.ubc.ca/landing/news.html">News</a>
                </li>
                <li>
                  <a href="https://www.ubc.ca/landing/events.html">Events</a>
                </li>
                <li>
                  <a href="https://hr.ubc.ca/careers-and-job-postings">
                    Careers
                  </a>
                </li>
                <li>
                  <a href="https://give.ubc.ca/">Make a Gift</a>
                </li>
                <li>
                  <a href="https://www.ubc.ca/search/">Search UBC.ca</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">UBC Campuses</h3>
              <ul className="space-y-1">
                <li>
                  <a href="https://www.ubc.ca/">Vancouver Campus</a>
                </li>
                <li>
                  <a href="https://ok.ubc.ca/">Okanagan Campus</a>
                </li>
              </ul>
              <h4 className="mt-2 font-semibold">UBC Sites</h4>
              <ul className="space-y-1">
                <li>
                  <a href="https://robsonsquare.ubc.ca/">Robson Square</a>
                </li>
                <li>
                  <a href="https://thecdm.ca/">Centre for Digital Media</a>
                </li>
                <li>
                  <a href="https://www.med.ubc.ca/about/campuses/">
                    Faculty of Medicine Across BC
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom footer strip */}
      <div style={{ backgroundColor: "#002145" }}>
        <div className="text-white text-xs py-4">
          <div className="max-w-6xl mx-auto text-center space-x-3">
            <a href="https://cdn.ubc.ca/clf/ref/emergency">
              Emergency Procedures
            </a>{" "}
            |<a href="https://cdn.ubc.ca/clf/ref/terms">Terms of Use</a> |
            <a href="https://cdn.ubc.ca/clf/ref/copyright">Copyright</a> |
            <a href="https://cdn.ubc.ca/clf/ref/accessibility">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
