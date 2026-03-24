import React from 'react'

export default function Login() {
  return (
    <div className="login-page">
      <h2>Login</h2>
      <form className="login-form">
        <label>
          Email
          <input type="email" />
        </label>
        <label>
          Password
          <input type="password" />
        </label>
        <button type="submit">Sign in</button>
      </form>
    </div>
  )
}
