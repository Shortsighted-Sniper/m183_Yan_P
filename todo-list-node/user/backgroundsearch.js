function getHtml(req) {
    let html = `
    <section id="search">
        <h2>Search</h2>
        <form id="form" method="post" action="">
            <div class="form-group">
                <label for="terms">terms</label>
                <input type="text" class="form-control size-medium" name="terms" id="terms">
            </div>
            <div class="form-group">
                <label for="submit" ></label>
                <input id="submit" type="submit" class="btn size-auto" value="Submit" />
            </div>
        </form>
        <div id="messages">
            <div id="msg" class="hidden">The search is running. Results will be visible soon.</div>
            <div id="result" class="hidden"></div>
        </div>
         <script>
            $(document).ready(function () {
            $('#form').validate({
                rules: {
                    terms: {
                        required: true
                    }
                },
                messages: {
                    title: 'Please enter search terms.',
                },
                submitHandler: function (form) {
                    terms = $("#terms").val();
                    $("#msg").show();
                    $("#result").html("");
                    $.post("search", { terms: terms }, function(data){
                        $("#result").html(data);
                        $("#msg").hide(500);
                        $("#result").show(500);
                    });
                    return false;
                }
            });
        });
        </script>
    </section>`;

    return html;
}

module.exports = {
    html: getHtml
}
