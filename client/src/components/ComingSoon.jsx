import { useState } from 'react'
import { Mail, ArrowRight, Zap, Lock, Users } from 'lucide-react'
import '../styles/coming-soon.css'

export default function ComingSoon() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (email.trim()) {
      setSubmitted(true)
      setEmail('')
      setTimeout(() => setSubmitted(false), 3000)
    }
  }

  return (
    <div className="coming-soon-wrapper">
      {/* Background elements */}
      <div className="background-blur"></div>
      <div className="animated-gradient"></div>
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>
      <div className="grid-background"></div>

      {/* Main content */}
      <div className="coming-soon-container">
        {/* Logo */}
        <div className="logo-section">
          <div className="logo-icon">CC</div>
          <span className="logo-text">Campus Crypt</span>
        </div>

        {/* Center content */}
        <div className="center-content">
          <h1 className="main-title">
            <span className="title-gradient">We're Building</span>
            <br />
            Something Special
            <br />
            <span className="title-highlight">For You</span>
          </h1>

          <p className="subtitle">Campus Crypt is in active development. Get notified when we launch.</p>

          {/* Email form */}
          <form className="email-form" onSubmit={handleSubmit}>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="submit-btn">
                Notify Me
                <ArrowRight size={16} />
              </button>
            </div>
            {submitted && <div className="success-message">✓ Thanks! We'll notify you when we launch.</div>}
          </form>

          {/* Features */}
          <div className="features-grid">
            <div className="feature-card">
              <Zap size={20} />
              <h3>Lightning Fast</h3>
              <p>Built with cutting-edge technology</p>
            </div>
            <div className="feature-card">
              <Lock size={20} />
              <h3>Secure</h3>
              <p>Your data is our priority</p>
            </div>
            <div className="feature-card">
              <Users size={20} />
              <h3>Community</h3>
              <p>Built for everyone, together</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer-section">
          <div className="social-links">
            <a href="#">Twitter</a>
            <a href="#">GitHub</a>
            <a href="#">Discord</a>
          </div>
          <p className="copyright">&copy; 2024 Campus Crypt</p>
        </div>
      </div>
    </div>
  )
}
