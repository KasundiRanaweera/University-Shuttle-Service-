import React from 'react';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import '../styles/Contact.css';

const Contact = () => {
  const [headerRef, headerVisible] = useScrollAnimation<HTMLDivElement>({ threshold: 0.2 });
  const [titleRef, titleVisible] = useScrollAnimation<HTMLHeadingElement>({ threshold: 0.2 });
  const [descRef, descVisible] = useScrollAnimation<HTMLParagraphElement>({ threshold: 0.2, delay: 200 });
  
  const contactOptions = [
    {
      icon: "fas fa-map-marker-alt",
      title: "Visit Us",
      description: "Stop by our office during business hours",
      link: "https://maps.google.com",
      text: "Click Here",
      delay: 200
    },
    {
      icon: "fas fa-phone",
      title: "Call Us",
      description: "Our support team is available during operating hours to assist you",
      link: "tel:8475550123",
      text: "(847) 555-0123",
      delay: 400
    },
    {
      icon: "fas fa-envelope",
      title: "Email Us",
      description: "Send us your questions and we'll get back to you within 24 hours",
      link: "mailto:campusshuttle@mail.com",
      text: "campusshuttle@mail.com",
      delay: 600
    }
  ];

  return (
    <section id="contact" className="contact-section">
      <div className="decoration"></div>
      <div className="decoration"></div>
      <div className="contact-container">
        <div 
          ref={headerRef}
          className="contact-header"
        >
          <h2 
            ref={titleRef}
            className={`fade-down ${titleVisible ? 'visible' : ''}`}
          >
            Get in Touch
          </h2>
          <p 
            ref={descRef}
            className={`fade-up ${descVisible ? 'visible' : ''}`}
          >
            Have questions about our shuttle service? We're here to help!
          </p>
        </div>

        <div className="contact-options">
          {contactOptions.map((option, index) => {
            const [optionRef, optionVisible] = useScrollAnimation<HTMLDivElement>({
              threshold: 0.2,
              delay: option.delay
            });

            return (
              <div
                key={index}
                ref={optionRef}
                className={`contact-option fade-up ${optionVisible ? 'visible' : ''}`}
              >
                <div className="content-wrapper">
                  <i className={option.icon}></i>
                  <h3>{option.title}</h3>
                  <p>{option.description}</p>
                  <a 
                    href={option.link} 
                    target={option.icon === "fas fa-map-marker-alt" ? "_blank" : undefined}
                    rel={option.icon === "fas fa-map-marker-alt" ? "noopener noreferrer" : undefined}
                  >
                    {option.text.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {line}
                        {i < option.text.split('\n').length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Contact;