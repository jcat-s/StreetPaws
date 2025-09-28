const AboutUs = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Mission */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Who We Are</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">StreetPaws is a community initiative partnering with Lipa City Veterinary Office to rescue, rehabilitate, and rehome stray animals while educating the public on responsible pet ownership.</p>
        </div>




        {/* How We Help section moved from Home */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How We Help Animals</h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            StreetPaws is dedicated to improving the lives of stray animals through rescue,
            rehabilitation, and community education.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-orange-600 font-bold text-xl">❤</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Rescue & Care</h3>
            <p className="text-gray-600">
              We rescue abandoned and injured animals, providing them with medical care
              and a safe place to recover.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-orange-600 font-bold text-xl">🤝</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Adoption Services</h3>
            <p className="text-gray-600">
              We help animals find their forever homes through our comprehensive
              adoption program.
            </p>
          </div>

          <div className="text-center">
            <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <span className="text-orange-600 font-bold text-xl">📍</span>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Lost & Found</h3>
            <p className="text-gray-600">
              We help reunite lost pets with their families and assist in finding
              homes for found animals.
            </p>
          </div>
        </div>

        {/* Team blurb */}
        <div className="bg-white border border-gray-100 rounded-lg p-6 mb-10">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Our Approach</h2>
          <p className="text-gray-700 mb-3">We collaborate with barangays, local vets, and volunteers to operate rescues, provide basic medical care, and manage adoption events. Transparency and community support are at the heart of what we do.</p>
          <p className="text-gray-700">Want to help? Check the Join Us page for volunteer roles, or donate supplies to our drive.</p>
        </div>


        {/* CTA moved from Home */}
        <div className="py-12 bg-orange-500 rounded-xl text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Make a Difference?</h2>
          <p className="text-xl text-orange-100 mb-8">
            Join us in our mission to create a safer, more compassionate world for animals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/donate"
              className="bg-white text-orange-500 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Donate Now
            </a>
            <a
              href="/join-us"
              className="border-2 border-white text-white hover:bg-white hover:text-orange-500 font-medium py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Volunteer
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AboutUs 