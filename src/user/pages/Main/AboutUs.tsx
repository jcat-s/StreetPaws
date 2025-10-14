import teamImage from '../../../assets/images/team/team.jpg'
import enricoImage from '../../../assets/images/team/enrico.png'
import jennieImage from '../../../assets/images/team/jennie.png'
import preciousImage from '../../../assets/images/team/precious.png'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay } from 'swiper/modules'
import 'swiper/css'

const AboutUs = () => {
  const teamMembers = [
      {
        name: 'Enrico Manalang',
        role: 'Project Manager / Programmer',
        emoji: '👨🏻‍💼🧭🖥️', // Manager + Programmer
        bgColor: 'bg-blue-50',
        image: enricoImage
      },
      {
        name: 'Jennie L. Cuenca',
        role: 'Developer / Designer',
        emoji: '👩🏻‍💻🎨💻', // Designer + Developer
        bgColor: 'bg-pink-50',
        image: jennieImage
      },
      {
        name: 'Precious Grace C. Abion',
        role: 'Documentation / QA',
        emoji: '👩🏻‍🏫🔍📝', // QA + Docs
        bgColor: 'bg-purple-50',
        image: preciousImage
      }
    ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Who We Are</h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            StreetPaws is a community initiative partnering with Lipa City Veterinary Office to rescue, rehabilitate, and rehome stray animals while educating the public on responsible pet ownership.
          </p>
        </div>

        {/* Team Photo Section */}
        <div className="mb-10 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="relative">
              <img 
                src={teamImage} 
                alt="Lipa City Veterinary Office Team" 
                className="w-full h-auto object-contain"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <p className="text-white/90 text-lg">Lipa City Veterinary Office Team</p>
              </div>
            </div>
          </div>
        </div>

        {/* How We Help section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-orange-600 mb-4">How We Help Animals</h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            StreetPaws is dedicated to improving the lives of stray animals through rescue,
            rehabilitation, and community education.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="bg-orange-100 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">❤️</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">Rescue & Care</h3>
            <p className="text-gray-600 text-sm text-center">
              We rescue abandoned and injured animals, providing them with medical care
              and a safe place to recover.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="bg-orange-100 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🤝</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">Adoption Services</h3>
            <p className="text-gray-600 text-sm text-center">
              We help animals find their forever homes through our comprehensive
              adoption program.
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="bg-orange-100 rounded-full w-14 h-14 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📍</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2 text-center">Lost & Found</h3>
            <p className="text-gray-600 text-sm text-center">
              We help reunite lost pets with their families and assist in finding
              homes for found animals.
            </p>
          </div>
        </div>

        {/* Our Approach & System Development Team - Side by Side */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {/* Our Approach */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-orange-600 mb-4">Our Approach</h2>
            <p className="text-gray-700 mb-3 leading-relaxed">
              We collaborate with barangays, local vets, and volunteers to operate rescues, provide basic medical care, and manage adoption events. Transparency and community support are at the heart of what we do.
            </p>
            <p className="text-gray-600 leading-relaxed">
              Want to help? Check the Join Us page for volunteer roles, or donate supplies to our drive.
            </p>
          </div>

          {/* System Development Team - Carousel */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <h2 className="text-2xl font-bold text-orange-600 mb-4 text-center">System Development Team</h2>
            
            {/* Swiper Carousel */}
            <Swiper
              modules={[Autoplay]}
              slidesPerView={1}
              spaceBetween={20}
              autoplay={{
                delay: 3000,
                disableOnInteraction: false,
              }}
              loop={true}
              className="h-auto px-4"
            >
              {teamMembers.map((member, index) => (
                <SwiperSlide key={index}>
                  <div className={`${member.bgColor} rounded-lg h-full flex items-center justify-between gap-4 relative overflow-hidden p-6`}>
                    {/* Center - Name, Role, and Emoji */}
                    <div className="flex-1 flex flex-col items-center justify-center text-center">
                      <h3 className="text-3xl font-bold text-gray-900 mb-2">{member.name}</h3>
                      <p className="text-gray-600 text-lg mb-3">{member.role}</p>
                      <div className="text-1xl">{member.emoji}</div>
                    </div>
                    
                    {/* Right Side - Image */}
                    {member.image && (
                      <div className="flex-shrink-0 overflow-hidden rounded-lg w-32 h-44 border-2 border-orange-300 shadow-md bg-white">
                        <img 
                          src={member.image} 
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-orange-500 rounded-lg shadow-md p-8 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">Ready to Make a Difference?</h2>
          <p className="text-white/90 mb-6 max-w-2xl mx-auto">
            Join us in our mission to create a safer, more compassionate world for animals.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="/donate"
              className="bg-white text-orange-500 hover:bg-gray-100 font-semibold py-2 px-6 rounded-md transition-colors duration-200"
            >
              Donate Now
            </a>
            <a
              href="/join-us"
              className="border-2 border-white text-white hover:bg-white hover:text-orange-500 font-semibold py-2 px-6 rounded-md transition-colors duration-200"
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