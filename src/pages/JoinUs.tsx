const JoinUs = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Join Our Volunteer Community</h1>
          <p className="text-lg text-gray-600">Give time, skills, or resources to help animals in need.</p>
        </div>

        {/* How it works */}
        <div className="grid md:grid-cols-3 gap-6 mb-10">
          {[{ title: 'Sign Up', desc: 'Create your volunteer profile and select interests.' }, { title: 'Get Trained', desc: 'Attend an orientation and basic handling seminar.' }, { title: 'Make Impact', desc: 'Assist in shelter care, rescues, events, and outreach.' }].map((s, i) => (
            <div key={i} className="bg-white rounded-lg shadow border border-gray-100 p-6 text-center">
              <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 mx-auto mb-3 flex items-center justify-center font-bold">{i + 1}</div>
              <h3 className="text-lg font-semibold mb-1">{s.title}</h3>
              <p className="text-sm text-gray-600">{s.desc}</p>
            </div>
          ))}
        </div>

        {/* Roles */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Volunteer Roles</h2>
          <ul className="grid md:grid-cols-2 gap-4">
            {['Shelter Care & Feeding', 'Transport & Rescue Assistance', 'Events & Fundraising', 'Foster Care', 'Photography & Content', 'Admin & Data'].map((r) => (
              <li key={r} className="bg-white border border-gray-100 rounded-lg p-4">{r}</li>
            ))}
          </ul>
        </div>

        {/* CTA */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-xl font-semibold mb-2">Ready to help?</h3>
          <p className="text-gray-600 mb-4">Submit a short application and we’ll contact you about the next orientation schedule.</p>
          <a href="" target="_blank" rel="noreferrer" className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-md">Apply as Volunteer</a>
        </div>
      </div>
    </div>
  )
}

export default JoinUs 