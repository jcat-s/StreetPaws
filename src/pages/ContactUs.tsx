const ContactUs = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Us</h1>
          <p className="text-lg text-gray-600">We’d love to hear from you. Reach us via any channel below.</p>
        </div>

        {/* Contact cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white border border-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-1">General Inquiries</h3>
            <p className="text-gray-600">streetpaws@example.com</p>
            <p className="text-gray-600">(043) 123 4567</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-1">Adoption & Foster</h3>
            <p className="text-gray-600">adopt@example.com</p>
            <p className="text-gray-600">(+63) 900 000 0000</p>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-1">Report & Rescue</h3>
            <p className="text-gray-600">rescue@example.com</p>
            <p className="text-gray-600">(+63) 911</p>
          </div>
        </div>

        {/* Message form (static) */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Send a Message</h2>
          <form className="grid md:grid-cols-2 gap-4">
            <input placeholder="Full Name" className="px-4 py-2 border border-gray-300 rounded-lg" />
            <input placeholder="Email" className="px-4 py-2 border border-gray-300 rounded-lg" />
            <input placeholder="Subject" className="md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg" />
            <textarea placeholder="Message" rows={4} className="md:col-span-2 px-4 py-2 border border-gray-300 rounded-lg" />
            <div className="md:col-span-2">
              <button type="button" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md">Send</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ContactUs 