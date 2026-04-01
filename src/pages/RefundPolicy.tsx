export default function RefundPolicy() {
  return (
    <div className="bg-gray-50 min-h-screen py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 prose prose-brand max-w-none">
          <h1 className="text-4xl font-bold text-brand-blue mb-8">Refund Policy</h1>
          <p className="text-gray-500 mb-8">Last Updated: April 1, 2026</p>
          
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-brand-blue mb-4">1. General Policy</h2>
            <p className="text-gray-600 leading-relaxed">
              At WorkinEU HR Consultancy LLC, we strive to provide the best service possible. Our refund policy is designed to be fair to both our clients and our consultancy.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-brand-blue mb-4">2. Service Fees</h2>
            <p className="text-gray-600 leading-relaxed">
              Consultancy and processing fees are generally non-refundable once the service has been initiated or documents have been processed. This is due to the administrative costs and time invested by our team.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-brand-blue mb-4">3. Exceptional Circumstances</h2>
            <p className="text-gray-600 leading-relaxed mb-4">
              Refunds may be considered under the following circumstances:
            </p>
            <ul className="list-disc pl-6 text-gray-600 space-y-2">
              <li>Service cancellation by WorkinEU HR Consultancy LLC</li>
              <li>Proven gross negligence on the part of the consultancy</li>
              <li>Duplicate payments made by the client</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-brand-blue mb-4">4. Non-Refundable Items</h2>
            <p className="text-gray-600 leading-relaxed">
              Government fees, visa application fees, and third-party authentication costs are strictly non-refundable as these are paid directly to external authorities.
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-bold text-brand-blue mb-4">5. Contact</h2>
            <p className="text-gray-600 leading-relaxed">
              For any refund-related queries, please contact our accounts department at accounts@workineuhr.com.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
